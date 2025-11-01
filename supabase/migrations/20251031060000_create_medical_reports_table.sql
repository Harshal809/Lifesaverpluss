-- Create medical_reports table for user medical information
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  age INTEGER,
  blood_group TEXT,
  height_cm INTEGER,
  weight_kg NUMERIC,
  medical_history TEXT, -- Previous illnesses, surgeries, etc.
  current_conditions TEXT, -- Current medical conditions
  medications TEXT, -- Current medications with dosages
  allergies TEXT, -- Known allergies
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  primary_physician_name TEXT,
  primary_physician_phone TEXT,
  background_notes TEXT, -- Additional medical background info
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one medical report per user (latest)
  CONSTRAINT unique_user_medical_report UNIQUE (user_id)
);

-- Enable RLS on medical_reports
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_reports
CREATE POLICY "Users can view their own medical reports"
  ON public.medical_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical reports"
  ON public.medical_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical reports"
  ON public.medical_reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow hospitals to view medical reports when responding to SOS
CREATE POLICY "Hospitals can view medical reports for assigned SOS requests"
  ON public.medical_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sos_requests
      WHERE sos_requests.user_id = medical_reports.user_id
        AND sos_requests.assigned_hospital_id = auth.uid()
        AND sos_requests.status IN ('active', 'pending', 'acknowledged')
    )
  );

-- Add update trigger for updated_at
CREATE TRIGGER update_medical_reports_updated_at
  BEFORE UPDATE ON public.medical_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_medical_reports_user_id ON public.medical_reports(user_id);

