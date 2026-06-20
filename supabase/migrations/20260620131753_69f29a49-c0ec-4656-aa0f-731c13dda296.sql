
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS signup_ip TEXT,
  ADD COLUMN IF NOT EXISTS signup_city TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  email TEXT,
  city TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signup_attempts_ip_idx ON public.signup_attempts(ip);

GRANT SELECT ON public.signup_attempts TO authenticated;
GRANT ALL ON public.signup_attempts TO service_role;

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view signup attempts"
  ON public.signup_attempts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, whatsapp, instagram, avatar_url, provider, status,
    signup_ip, signup_city, terms_accepted_at, marketing_opt_in
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'instagram',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    'active',
    NEW.raw_user_meta_data->>'signup_ip',
    NEW.raw_user_meta_data->>'signup_city',
    CASE WHEN (NEW.raw_user_meta_data->>'terms_accepted_at') IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz
         ELSE NULL END,
    COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
