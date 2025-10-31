-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  user_type TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'user')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own emergency contacts"
  ON public.emergency_contacts FOR ALL
  USING (auth.uid() = user_id);

-- Create responder_details table
CREATE TABLE IF NOT EXISTS public.responder_details (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  responder_type TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_on_duty BOOLEAN DEFAULT false,
  current_location JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.responder_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Responders can view their own details"
  ON public.responder_details FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Responders can update their own details"
  ON public.responder_details FOR UPDATE
  USING (auth.uid() = id);

-- Create hospital_profiles table
CREATE TABLE IF NOT EXISTS public.hospital_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  capacity INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  specialties TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hospital_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospitals can manage their own profile"
  ON public.hospital_profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Everyone can view hospital profiles"
  ON public.hospital_profiles FOR SELECT
  USING (true);

-- Create sos_requests table
CREATE TABLE IF NOT EXISTS public.sos_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  emergency_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_hospital_id UUID REFERENCES public.hospital_profiles(id),
  user_address TEXT,
  notes TEXT,
  estimated_arrival TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own SOS requests"
  ON public.sos_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own SOS requests"
  ON public.sos_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Hospitals can view assigned SOS requests"
  ON public.sos_requests FOR SELECT
  USING (auth.uid() = assigned_hospital_id);

CREATE POLICY "Hospitals can update assigned SOS requests"
  ON public.sos_requests FOR UPDATE
  USING (auth.uid() = assigned_hospital_id);

-- Create emergency_alerts table
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  responder_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own alerts"
  ON public.emergency_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own alerts"
  ON public.emergency_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Responders can view all active alerts"
  ON public.emergency_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.responder_details
      WHERE id = auth.uid() AND is_verified = true
    )
  );

CREATE POLICY "Responders can update alerts they respond to"
  ON public.emergency_alerts FOR UPDATE
  USING (auth.uid() = responder_id OR auth.uid() = user_id);

-- Create anonymous_reports table
CREATE TABLE IF NOT EXISTS public.anonymous_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT NOT NULL,
  type TEXT,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  priority TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  responder_id UUID REFERENCES public.profiles(id),
  responded_at TIMESTAMPTZ,
  resolution_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.anonymous_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create anonymous reports"
  ON public.anonymous_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Responders can view all reports"
  ON public.anonymous_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.responder_details
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Responders can update reports"
  ON public.anonymous_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.responder_details
      WHERE id = auth.uid()
    )
  );

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anonymous_reports;

-- Create update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_responder_details_updated_at
  BEFORE UPDATE ON public.responder_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hospital_profiles_updated_at
  BEFORE UPDATE ON public.hospital_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sos_requests_updated_at
  BEFORE UPDATE ON public.sos_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at
  BEFORE UPDATE ON public.emergency_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anonymous_reports_updated_at
  BEFORE UPDATE ON public.anonymous_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();