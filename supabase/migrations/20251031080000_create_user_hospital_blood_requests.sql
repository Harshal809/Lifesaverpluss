-- User Hospital Blood Requests System
-- Allows users to request blood from hospitals with accept/reject functionality

-- =====================================================
-- 1. User Hospital Blood Requests Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_hospital_blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospital_profiles(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_required INTEGER NOT NULL DEFAULT 1 CHECK (units_required > 0),
  units_approved INTEGER DEFAULT 0,
  urgency_level TEXT NOT NULL DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'urgent', 'critical')),
  patient_name TEXT,
  patient_age INTEGER,
  patient_condition TEXT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  hospital_response TEXT,
  responded_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for user_hospital_blood_requests
CREATE INDEX IF NOT EXISTS idx_user_hospital_blood_requests_user_id ON public.user_hospital_blood_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hospital_blood_requests_hospital_id ON public.user_hospital_blood_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_user_hospital_blood_requests_blood_group ON public.user_hospital_blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_user_hospital_blood_requests_status ON public.user_hospital_blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_hospital_blood_requests_urgency ON public.user_hospital_blood_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_user_hospital_blood_requests_created_at ON public.user_hospital_blood_requests(created_at DESC);

-- =====================================================
-- 2. Hospital Chat Table Extension
-- =====================================================
-- Add hospital_request_id to blood_chat for hospital requests
ALTER TABLE public.blood_chat 
ADD COLUMN IF NOT EXISTS hospital_request_id UUID REFERENCES public.user_hospital_blood_requests(id) ON DELETE CASCADE;

-- Index for hospital_request_id
CREATE INDEX IF NOT EXISTS idx_blood_chat_hospital_request_id ON public.blood_chat(hospital_request_id);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on user_hospital_blood_requests
ALTER TABLE public.user_hospital_blood_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_hospital_blood_requests' 
    AND policyname = 'Users can view their own hospital requests'
  ) THEN
    CREATE POLICY "Users can view their own hospital requests"
      ON public.user_hospital_blood_requests FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Hospitals can view requests for their hospital
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_hospital_blood_requests' 
    AND policyname = 'Hospitals can view requests for their hospital'
  ) THEN
    CREATE POLICY "Hospitals can view requests for their hospital"
      ON public.user_hospital_blood_requests FOR SELECT
      USING (auth.uid() = hospital_id);
  END IF;
END $$;

-- Users can insert their own requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_hospital_blood_requests' 
    AND policyname = 'Users can insert their own hospital requests'
  ) THEN
    CREATE POLICY "Users can insert their own hospital requests"
      ON public.user_hospital_blood_requests FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own pending requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_hospital_blood_requests' 
    AND policyname = 'Users can update their own pending requests'
  ) THEN
    CREATE POLICY "Users can update their own pending requests"
      ON public.user_hospital_blood_requests FOR UPDATE
      USING (auth.uid() = user_id AND status = 'pending');
  END IF;
END $$;

-- Hospitals can update requests for their hospital (approve/reject)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_hospital_blood_requests' 
    AND policyname = 'Hospitals can update requests for their hospital'
  ) THEN
    CREATE POLICY "Hospitals can update requests for their hospital"
      ON public.user_hospital_blood_requests FOR UPDATE
      USING (auth.uid() = hospital_id AND status = 'pending');
  END IF;
END $$;

-- Users can cancel their own requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_hospital_blood_requests' 
    AND policyname = 'Users can cancel their own requests'
  ) THEN
    CREATE POLICY "Users can cancel their own requests"
      ON public.user_hospital_blood_requests FOR UPDATE
      USING (auth.uid() = user_id AND status IN ('pending', 'approved'));
  END IF;
END $$;

-- =====================================================
-- 4. Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_hospital_blood_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_user_hospital_blood_requests_updated_at ON public.user_hospital_blood_requests;
CREATE TRIGGER trigger_update_user_hospital_blood_requests_updated_at
  BEFORE UPDATE ON public.user_hospital_blood_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_user_hospital_blood_requests_updated_at();

-- Function to update responded_at when hospital responds
CREATE OR REPLACE FUNCTION update_hospital_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for responded_at
DROP TRIGGER IF EXISTS trigger_update_hospital_response_timestamp ON public.user_hospital_blood_requests;
CREATE TRIGGER trigger_update_hospital_response_timestamp
  BEFORE UPDATE ON public.user_hospital_blood_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_hospital_response_timestamp();

-- Function to update hospital inventory when request is approved
CREATE OR REPLACE FUNCTION update_hospital_inventory_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Reserve the approved units in hospital inventory
    UPDATE public.hospital_blood_inventory
    SET 
      units_reserved = units_reserved + NEW.units_approved,
      updated_at = now()
    WHERE 
      hospital_id = NEW.hospital_id 
      AND blood_group = NEW.blood_group
      AND units_available >= (units_reserved + NEW.units_approved);
  END IF;
  
  IF NEW.status = 'fulfilled' AND OLD.status = 'approved' THEN
    -- Deduct from inventory when fulfilled
    UPDATE public.hospital_blood_inventory
    SET 
      units_available = units_available - NEW.units_approved,
      units_reserved = units_reserved - NEW.units_approved,
      updated_at = now()
    WHERE 
      hospital_id = NEW.hospital_id 
      AND blood_group = NEW.blood_group;
      
    NEW.fulfilled_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for inventory updates
DROP TRIGGER IF EXISTS trigger_update_hospital_inventory_on_approval ON public.user_hospital_blood_requests;
CREATE TRIGGER trigger_update_hospital_inventory_on_approval
  BEFORE UPDATE ON public.user_hospital_blood_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_hospital_inventory_on_approval();

-- =====================================================
-- 5. Real-time Support
-- =====================================================

-- Enable real-time for user_hospital_blood_requests
-- Note: IF NOT EXISTS is not supported for ALTER PUBLICATION, so we use DO block
DO $$ 
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'user_hospital_blood_requests'
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_hospital_blood_requests;
  END IF;
END $$;

-- =====================================================
-- 6. Update blood_chat policies for hospital requests
-- =====================================================

-- Allow users and hospitals to chat about hospital requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_chat' 
    AND policyname = 'Users can chat about their hospital requests'
  ) THEN
    CREATE POLICY "Users can chat about their hospital requests"
      ON public.blood_chat FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_hospital_blood_requests
          WHERE user_hospital_blood_requests.id = blood_chat.hospital_request_id
          AND user_hospital_blood_requests.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_chat' 
    AND policyname = 'Hospitals can chat about their hospital requests'
  ) THEN
    CREATE POLICY "Hospitals can chat about their hospital requests"
      ON public.blood_chat FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_hospital_blood_requests
          WHERE user_hospital_blood_requests.id = blood_chat.hospital_request_id
          AND user_hospital_blood_requests.hospital_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_chat' 
    AND policyname = 'Users can send messages for their hospital requests'
  ) THEN
    CREATE POLICY "Users can send messages for their hospital requests"
      ON public.blood_chat FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_hospital_blood_requests
          WHERE user_hospital_blood_requests.id = blood_chat.hospital_request_id
          AND user_hospital_blood_requests.user_id = auth.uid()
        )
        AND sender_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_chat' 
    AND policyname = 'Hospitals can send messages for their hospital requests'
  ) THEN
    CREATE POLICY "Hospitals can send messages for their hospital requests"
      ON public.blood_chat FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_hospital_blood_requests
          WHERE user_hospital_blood_requests.id = blood_chat.hospital_request_id
          AND user_hospital_blood_requests.hospital_id = auth.uid()
        )
        AND sender_id = auth.uid()
      );
  END IF;
END $$;

