-- Blood Donation System Schema
-- Comprehensive schema for blood donors, accepters, chat, and hospital blood management

-- =====================================================
-- 1. Blood Donors Table - Users who want to donate blood
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blood_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  is_available BOOLEAN DEFAULT true,
  last_donation_date DATE,
  next_available_date DATE,
  donation_count INTEGER DEFAULT 0,
  phone TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  health_declaration BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes for blood_donors
CREATE INDEX IF NOT EXISTS idx_blood_donors_user_id ON public.blood_donors(user_id);
CREATE INDEX IF NOT EXISTS idx_blood_donors_blood_group ON public.blood_donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_donors_is_available ON public.blood_donors(is_available);
CREATE INDEX IF NOT EXISTS idx_blood_donors_next_available_date ON public.blood_donors(next_available_date);

-- =====================================================
-- 2. Blood Requests Table - Users/Hospitals who need blood
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_type TEXT NOT NULL CHECK (requester_type IN ('user', 'hospital')),
  hospital_id UUID REFERENCES public.hospital_profiles(id) ON DELETE SET NULL,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_required INTEGER NOT NULL DEFAULT 1 CHECK (units_required > 0),
  units_received INTEGER DEFAULT 0,
  urgency_level TEXT NOT NULL DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'urgent', 'critical')),
  patient_name TEXT,
  patient_age INTEGER,
  patient_condition TEXT,
  hospital_name TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired')),
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);

-- Indexes for blood_requests
CREATE INDEX IF NOT EXISTS idx_blood_requests_requester_id ON public.blood_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital_id ON public.blood_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON public.blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON public.blood_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created_at ON public.blood_requests(created_at DESC);

-- =====================================================
-- 3. Blood Donations Table - Track actual donations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blood_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.blood_donors(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.blood_requests(id) ON DELETE SET NULL,
  blood_group TEXT NOT NULL,
  units_donated INTEGER DEFAULT 1,
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  donation_location TEXT,
  verified_by UUID REFERENCES public.hospital_profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for blood_donations
CREATE INDEX IF NOT EXISTS idx_blood_donations_donor_id ON public.blood_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_blood_donations_request_id ON public.blood_donations(request_id);
CREATE INDEX IF NOT EXISTS idx_blood_donations_donation_date ON public.blood_donations(donation_date DESC);

-- =====================================================
-- 4. Blood Chat/Messages Table - Communication between users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blood_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for blood_chat
CREATE INDEX IF NOT EXISTS idx_blood_chat_request_id ON public.blood_chat(request_id);
CREATE INDEX IF NOT EXISTS idx_blood_chat_sender_id ON public.blood_chat(sender_id);
CREATE INDEX IF NOT EXISTS idx_blood_chat_receiver_id ON public.blood_chat(receiver_id);
CREATE INDEX IF NOT EXISTS idx_blood_chat_created_at ON public.blood_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_chat_is_read ON public.blood_chat(is_read);
CREATE INDEX IF NOT EXISTS idx_blood_chat_conversation ON public.blood_chat(request_id, created_at DESC);

-- =====================================================
-- 5. Hospital Blood Inventory Table - Track hospital blood stock
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hospital_blood_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospital_profiles(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_available INTEGER NOT NULL DEFAULT 0 CHECK (units_available >= 0),
  units_reserved INTEGER DEFAULT 0 CHECK (units_reserved >= 0),
  expiry_dates JSONB,
  last_updated TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hospital_id, blood_group)
);

-- Indexes for hospital_blood_inventory
CREATE INDEX IF NOT EXISTS idx_hospital_blood_inventory_hospital_id ON public.hospital_blood_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_blood_inventory_blood_group ON public.hospital_blood_inventory(blood_group);
CREATE INDEX IF NOT EXISTS idx_hospital_blood_inventory_units ON public.hospital_blood_inventory(units_available);

-- =====================================================
-- 6. Hospital Blood Requests Table - Hospital requests for specific blood
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hospital_blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospital_profiles(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_required INTEGER NOT NULL DEFAULT 1 CHECK (units_required > 0),
  units_received INTEGER DEFAULT 0,
  urgency_level TEXT NOT NULL DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'urgent', 'critical')),
  patient_name TEXT,
  patient_id TEXT,
  department TEXT,
  doctor_name TEXT,
  doctor_contact TEXT,
  reason TEXT,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_fulfilled', 'fulfilled', 'cancelled')),
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);

-- Indexes for hospital_blood_requests
CREATE INDEX IF NOT EXISTS idx_hospital_blood_requests_hospital_id ON public.hospital_blood_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_blood_requests_blood_group ON public.hospital_blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_hospital_blood_requests_status ON public.hospital_blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_hospital_blood_requests_urgency ON public.hospital_blood_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_hospital_blood_requests_priority ON public.hospital_blood_requests(priority DESC);

-- =====================================================
-- 7. Blood Donor Requests Link Table - Links donors to requests
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blood_donor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.blood_donors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  donor_response_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, donor_id)
);

-- Indexes for blood_donor_requests
CREATE INDEX IF NOT EXISTS idx_blood_donor_requests_request_id ON public.blood_donor_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_blood_donor_requests_donor_id ON public.blood_donor_requests(donor_id);
CREATE INDEX IF NOT EXISTS idx_blood_donor_requests_status ON public.blood_donor_requests(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donor_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Blood Donors Policies
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_donors' 
    AND policyname = 'Users can view available blood donors'
  ) THEN
    CREATE POLICY "Users can view available blood donors"
      ON public.blood_donors FOR SELECT
      USING (is_available = true OR auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_donors' 
    AND policyname = 'Users can insert their own donor profile'
  ) THEN
    CREATE POLICY "Users can insert their own donor profile"
      ON public.blood_donors FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_donors' 
    AND policyname = 'Users can update their own donor profile'
  ) THEN
    CREATE POLICY "Users can update their own donor profile"
      ON public.blood_donors FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_donors' 
    AND policyname = 'Users can delete their own donor profile'
  ) THEN
    CREATE POLICY "Users can delete their own donor profile"
      ON public.blood_donors FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- Blood Requests Policies
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_requests' 
    AND policyname = 'Users can view active blood requests'
  ) THEN
    CREATE POLICY "Users can view active blood requests"
      ON public.blood_requests FOR SELECT
      USING (status IN ('active', 'partially_fulfilled') OR auth.uid() = requester_id OR 
             (requester_type = 'hospital' AND hospital_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_requests' 
    AND policyname = 'Users can create blood requests'
  ) THEN
    CREATE POLICY "Users can create blood requests"
      ON public.blood_requests FOR INSERT
      WITH CHECK (auth.uid() = requester_id OR 
                  (requester_type = 'hospital' AND hospital_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_requests' 
    AND policyname = 'Users can update their own requests'
  ) THEN
    CREATE POLICY "Users can update their own requests"
      ON public.blood_requests FOR UPDATE
      USING (auth.uid() = requester_id OR 
             (requester_type = 'hospital' AND hospital_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_requests' 
    AND policyname = 'Users can delete their own requests'
  ) THEN
    CREATE POLICY "Users can delete their own requests"
      ON public.blood_requests FOR DELETE
      USING (auth.uid() = requester_id OR 
             (requester_type = 'hospital' AND hospital_id = auth.uid()));
  END IF;
END $$;

-- =====================================================
-- Blood Donations Policies
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_donations' 
    AND policyname = 'Users can view their donations'
  ) THEN
    CREATE POLICY "Users can view their donations"
      ON public.blood_donations FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.blood_donors 
          WHERE blood_donors.id = blood_donations.donor_id 
          AND blood_donors.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.blood_requests 
          WHERE blood_requests.id = blood_donations.request_id 
          AND blood_requests.requester_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_donations' 
    AND policyname = 'Users can insert their donations'
  ) THEN
    CREATE POLICY "Users can insert their donations"
      ON public.blood_donations FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.blood_donors 
          WHERE blood_donors.id = blood_donations.donor_id 
          AND blood_donors.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- Blood Chat Policies
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_chat' 
    AND policyname = 'Users can view their chat messages'
  ) THEN
    CREATE POLICY "Users can view their chat messages"
      ON public.blood_chat FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_chat' 
    AND policyname = 'Users can send chat messages'
  ) THEN
    CREATE POLICY "Users can send chat messages"
      ON public.blood_chat FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_chat' 
    AND policyname = 'Users can update their messages'
  ) THEN
    CREATE POLICY "Users can update their messages"
      ON public.blood_chat FOR UPDATE
      USING (auth.uid() = receiver_id);
  END IF;
END $$;

-- =====================================================
-- Hospital Blood Inventory Policies
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hospital_blood_inventory' 
    AND policyname = 'Hospitals can view their inventory'
  ) THEN
    CREATE POLICY "Hospitals can view their inventory"
      ON public.hospital_blood_inventory FOR SELECT
      USING (hospital_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hospital_blood_inventory' 
    AND policyname = 'Users can view all hospital inventories'
  ) THEN
    CREATE POLICY "Users can view all hospital inventories"
      ON public.hospital_blood_inventory FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hospital_blood_inventory' 
    AND policyname = 'Hospitals can manage their inventory'
  ) THEN
    CREATE POLICY "Hospitals can manage their inventory"
      ON public.hospital_blood_inventory FOR ALL
      USING (hospital_id = auth.uid());
  END IF;
END $$;

-- =====================================================
-- Hospital Blood Requests Policies
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hospital_blood_requests' 
    AND policyname = 'Users can view hospital blood requests'
  ) THEN
    CREATE POLICY "Users can view hospital blood requests"
      ON public.hospital_blood_requests FOR SELECT
      USING (status IN ('active', 'partially_fulfilled') OR hospital_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hospital_blood_requests' 
    AND policyname = 'Hospitals can manage their requests'
  ) THEN
    CREATE POLICY "Hospitals can manage their requests"
      ON public.hospital_blood_requests FOR ALL
      USING (hospital_id = auth.uid());
  END IF;
END $$;

-- =====================================================
-- Blood Donor Requests Link Policies
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_donor_requests' 
    AND policyname = 'Users can view donor-request links'
  ) THEN
    CREATE POLICY "Users can view donor-request links"
      ON public.blood_donor_requests FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.blood_requests 
          WHERE blood_requests.id = blood_donor_requests.request_id 
          AND blood_requests.requester_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.blood_donors 
          WHERE blood_donors.id = blood_donor_requests.donor_id 
          AND blood_donors.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_donor_requests' 
    AND policyname = 'Users can create donor-request links'
  ) THEN
    CREATE POLICY "Users can create donor-request links"
      ON public.blood_donor_requests FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.blood_donors 
          WHERE blood_donors.id = blood_donor_requests.donor_id 
          AND blood_donors.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blood_donor_requests' 
    AND policyname = 'Users can update donor-request links'
  ) THEN
    CREATE POLICY "Users can update donor-request links"
      ON public.blood_donor_requests FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.blood_requests 
          WHERE blood_requests.id = blood_donor_requests.request_id 
          AND blood_requests.requester_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.blood_donors 
          WHERE blood_donors.id = blood_donor_requests.donor_id 
          AND blood_donors.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update donor availability after donation
CREATE OR REPLACE FUNCTION public.update_donor_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update donor's donation count and next available date (90 days from donation)
  UPDATE public.blood_donors
  SET 
    donation_count = donation_count + NEW.units_donated,
    last_donation_date = NEW.donation_date,
    next_available_date = NEW.donation_date + INTERVAL '90 days',
    updated_at = now()
  WHERE id = NEW.donor_id;
  
  -- Update request fulfilled status if linked
  IF NEW.request_id IS NOT NULL THEN
    UPDATE public.blood_requests
    SET 
      units_received = units_received + NEW.units_donated,
      status = CASE 
        WHEN units_received + NEW.units_donated >= units_required THEN 'fulfilled'
        WHEN units_received + NEW.units_donated > 0 THEN 'partially_fulfilled'
        ELSE status
      END,
      fulfilled_at = CASE 
        WHEN units_received + NEW.units_donated >= units_required THEN now()
        ELSE fulfilled_at
      END,
      updated_at = now()
    WHERE id = NEW.request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_blood_donation_insert
  AFTER INSERT ON public.blood_donations
  FOR EACH ROW EXECUTE FUNCTION public.update_donor_availability();

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_blood_donors_updated_at
  BEFORE UPDATE ON public.blood_donors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at
  BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blood_donations_updated_at
  BEFORE UPDATE ON public.blood_donations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blood_chat_updated_at
  BEFORE UPDATE ON public.blood_chat
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hospital_blood_inventory_updated_at
  BEFORE UPDATE ON public.hospital_blood_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hospital_blood_requests_updated_at
  BEFORE UPDATE ON public.hospital_blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blood_donor_requests_updated_at
  BEFORE UPDATE ON public.blood_donor_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-expire old requests
CREATE OR REPLACE FUNCTION public.expire_old_blood_requests()
RETURNS void AS $$
BEGIN
  UPDATE public.blood_requests
  SET status = 'expired'
  WHERE status IN ('active', 'partially_fulfilled')
    AND expiry_date IS NOT NULL
    AND expiry_date < now();
    
  UPDATE public.hospital_blood_requests
  SET status = 'cancelled'
  WHERE status = 'active'
    AND expiry_date IS NOT NULL
    AND expiry_date < now();
END;
$$ LANGUAGE plpgsql;
