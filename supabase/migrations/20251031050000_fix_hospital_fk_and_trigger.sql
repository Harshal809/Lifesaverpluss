-- 1) Make hospital_profiles.id reference auth.users(id) instead of profiles(id)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'public.hospital_profiles'::regclass
    AND contype = 'f';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.hospital_profiles DROP CONSTRAINT %I', fk_name);
  END IF;

  EXECUTE 'ALTER TABLE public.hospital_profiles
           ADD CONSTRAINT hospital_profiles_id_fkey
           FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE';
END $$;

-- 2) Update trigger function to NOT create profiles for hospitals
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>''user_type'', ''user'') <> ''hospital'' THEN
    INSERT INTO public.profiles (id, email, first_name, last_name, user_type)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>''first_name'',
      NEW.raw_user_meta_data->>''last_name'',
      COALESCE(NEW.raw_user_meta_data->>''user_type'', ''user'')
    );
  END IF;
  RETURN NEW;
END;
$$;

