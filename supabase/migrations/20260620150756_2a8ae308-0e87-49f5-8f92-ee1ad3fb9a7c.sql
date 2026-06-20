
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_bonus integer NOT NULL DEFAULT 1000;

UPDATE public.profiles SET welcome_bonus = 1000 WHERE welcome_bonus = 0;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, whatsapp, instagram, avatar_url, provider, status,
    signup_ip, signup_city, terms_accepted_at, marketing_opt_in, welcome_bonus
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
    COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false),
    1000
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
