-- Add user acceptance functionality to hospital_blood_requests
-- Allows users to accept hospital blood requests

-- =====================================================
-- 1. Add columns for user acceptance
-- =====================================================
ALTER TABLE public.hospital_blood_requests
ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_response TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_hospital_blood_requests_accepted_by ON public.hospital_blood_requests(accepted_by);
CREATE INDEX IF NOT EXISTS idx_hospital_blood_requests_status_accepted ON public.hospital_blood_requests(status, accepted_by);

-- =====================================================
-- 2. Update RLS Policies
-- =====================================================

-- Users can view active hospital blood requests (to accept them)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hospital_blood_requests' 
    AND policyname = 'Users can view active hospital blood requests'
  ) THEN
    CREATE POLICY "Users can view active hospital blood requests"
      ON public.hospital_blood_requests FOR SELECT
      USING (status IN ('active', 'partially_fulfilled'));
  END IF;
END $$;

-- Users can update hospital requests they accepted
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hospital_blood_requests' 
    AND policyname = 'Users can update accepted hospital requests'
  ) THEN
    CREATE POLICY "Users can update accepted hospital requests"
      ON public.hospital_blood_requests FOR UPDATE
      USING (accepted_by = auth.uid());
  END IF;
END $$;

-- Users can accept active hospital requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hospital_blood_requests' 
    AND policyname = 'Users can accept active hospital requests'
  ) THEN
    CREATE POLICY "Users can accept active hospital requests"
      ON public.hospital_blood_requests FOR UPDATE
      USING (
        status IN ('active', 'partially_fulfilled') 
        AND accepted_by IS NULL
      )
      WITH CHECK (
        accepted_by = auth.uid()
        AND accepted_at IS NOT NULL
      );
  END IF;
END $$;

-- Hospitals can cancel their own requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hospital_blood_requests' 
    AND policyname = 'Hospitals can cancel their own requests'
  ) THEN
    CREATE POLICY "Hospitals can cancel their own requests"
      ON public.hospital_blood_requests FOR UPDATE
      USING (
        auth.uid() = hospital_id 
        AND status IN ('active', 'partially_fulfilled')
      )
      WITH CHECK (
        status = 'cancelled'
        AND cancelled_at IS NOT NULL
        AND cancelled_by = auth.uid()
      );
  END IF;
END $$;

-- =====================================================
-- 3. Functions and Triggers
-- =====================================================

-- Function to set accepted_at when user accepts
CREATE OR REPLACE FUNCTION set_hospital_request_accepted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.accepted_by IS NOT NULL AND OLD.accepted_by IS NULL THEN
    NEW.accepted_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for accepted_at
DROP TRIGGER IF EXISTS trigger_set_hospital_request_accepted_at ON public.hospital_blood_requests;
CREATE TRIGGER trigger_set_hospital_request_accepted_at
  BEFORE UPDATE ON public.hospital_blood_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_hospital_request_accepted_at();

-- Function to set cancelled_at when hospital cancels
CREATE OR REPLACE FUNCTION set_hospital_request_cancelled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = now();
    NEW.cancelled_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cancelled_at
DROP TRIGGER IF EXISTS trigger_set_hospital_request_cancelled_at ON public.hospital_blood_requests;
CREATE TRIGGER trigger_set_hospital_request_cancelled_at
  BEFORE UPDATE ON public.hospital_blood_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_hospital_request_cancelled_at();

-- Function to update units_received when user accepts
CREATE OR REPLACE FUNCTION update_hospital_request_on_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user accepts, we can track it but don't automatically update units_received
  -- This will be updated when the actual donation happens
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for acceptance tracking
DROP TRIGGER IF EXISTS trigger_update_hospital_request_on_acceptance ON public.hospital_blood_requests;
CREATE TRIGGER trigger_update_hospital_request_on_acceptance
  AFTER UPDATE ON public.hospital_blood_requests
  FOR EACH ROW
  WHEN (NEW.accepted_by IS NOT NULL AND OLD.accepted_by IS NULL)
  EXECUTE FUNCTION update_hospital_request_on_acceptance();

