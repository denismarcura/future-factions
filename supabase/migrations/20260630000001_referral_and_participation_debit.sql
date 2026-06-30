-- Migration: referral bonus + participation debit idempotency
-- 1. Add referrer_id column to profiles
-- 2. Update handle_new_user to store referrer and credit 500 TKN to them
-- 3. Partial unique index to prevent duplicate participation debits per challenge

-- -----------------------------------------------------------------------
-- 1. referrer_id em profiles
-- -----------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------
-- 2. Índice único parcial: um débito de participation por (user, challenge)
-- -----------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_tx_participation_unique
  ON public.token_transactions(user_id, challenge_id)
  WHERE reason = 'participation' AND challenge_id IS NOT NULL;

-- -----------------------------------------------------------------------
-- 3. Atualiza handle_new_user para persistir referrer_id e creditar o
--    convidador com +500 TKN em token_transactions.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _referrer_id UUID;
  _row_count   INTEGER := 0;
BEGIN
  -- Tenta converter o metadata referrer_id para UUID; ignora se inválido
  BEGIN
    _referrer_id := (NEW.raw_user_meta_data->>'referrer_id')::UUID;
  EXCEPTION WHEN others THEN
    _referrer_id := NULL;
  END;

  INSERT INTO public.profiles (
    id, full_name, email, whatsapp, instagram, cpf, avatar_url, provider, status,
    signup_ip, signup_city, terms_accepted_at, marketing_opt_in, welcome_bonus, referrer_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'instagram',
    NEW.raw_user_meta_data->>'cpf',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    'active',
    NEW.raw_user_meta_data->>'signup_ip',
    NEW.raw_user_meta_data->>'signup_city',
    CASE WHEN (NEW.raw_user_meta_data->>'terms_accepted_at') IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz
         ELSE NULL END,
    COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false),
    1000,
    _referrer_id
  )
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS _row_count = ROW_COUNT;

  -- Só credita bônus se o perfil foi efetivamente criado agora (não conflict)
  -- e se há um referrer válido
  IF _row_count > 0 AND _referrer_id IS NOT NULL THEN
    -- Garante que o referrer existe antes de creditar (proteção extra)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = _referrer_id) THEN
      INSERT INTO public.token_transactions (user_id, delta, reason)
      VALUES (_referrer_id, 500, 'referral_signup');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
