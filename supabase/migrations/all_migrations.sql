
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, whatsapp, avatar_url, provider, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'whatsapp',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- Missions catalog
CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_name text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('instagram','youtube','google')),
  action_type text NOT NULL CHECK (action_type IN ('follow','like','comment','share','tag','review')),
  title text NOT NULL,
  link text NOT NULL,
  tokens integer NOT NULL DEFAULT 50,
  bonus_tokens integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.missions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active missions"
  ON public.missions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage missions"
  ON public.missions FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER missions_set_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mission claims (one per user per mission per context)
CREATE TABLE public.mission_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  context text NOT NULL DEFAULT 'missoes',
  tokens_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id, context)
);

GRANT SELECT, INSERT ON public.mission_claims TO authenticated;
GRANT ALL ON public.mission_claims TO service_role;

ALTER TABLE public.mission_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own claims"
  ON public.mission_claims FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users create own claims"
  ON public.mission_claims FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

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

CREATE TABLE public.challenge_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenge_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_categories TO authenticated;
GRANT ALL ON public.challenge_categories TO service_role;
ALTER TABLE public.challenge_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.challenge_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.challenge_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_challenge_categories_updated BEFORE UPDATE ON public.challenge_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.challenge_subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.challenge_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);
GRANT SELECT ON public.challenge_subcategories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_subcategories TO authenticated;
GRANT ALL ON public.challenge_subcategories TO service_role;
ALTER TABLE public.challenge_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subcategories" ON public.challenge_subcategories FOR SELECT USING (true);
CREATE POLICY "Admins manage subcategories" ON public.challenge_subcategories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_challenge_subcategories_updated BEFORE UPDATE ON public.challenge_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default categories
INSERT INTO public.challenge_categories (name, sort_order) VALUES
  ('Copa do Mundo 2026', 1),
  ('Palpites Malucos da Copa', 2),
  ('Futebol', 3),
  ('Política', 4),
  ('Economia', 5),
  ('Tecnologia', 6),
  ('Inteligência Artificial', 7),
  ('Ciência', 8),
  ('Alienígenas', 9),
  ('Conspirações', 10),
  ('Entretenimento', 11),
  ('Brasil', 12),
  ('Mundo', 13)
ON CONFLICT (name) DO NOTHING;

-- 1. Restrict missions management to admins
DROP POLICY IF EXISTS "Authenticated users can manage missions" ON public.missions;
CREATE POLICY "Admins manage missions" ON public.missions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Lock tokens_awarded on mission_claims to the mission's tokens value
DROP POLICY IF EXISTS "Users create own claims" ON public.mission_claims;
CREATE POLICY "Users create own claims" ON public.mission_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND tokens_awarded = (SELECT m.tokens FROM public.missions m WHERE m.id = mission_id AND m.active = true)
  );

-- 3. Explicit restrictive block: only admins can read signup_attempts
CREATE POLICY "Block non-admin reads on signup_attempts"
  ON public.signup_attempts
  AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Revoke EXECUTE on has_role from public/authenticated; only used internally by RLS (SECURITY DEFINER bypasses grant for policy use)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

WITH new_cat AS (
  INSERT INTO public.challenge_categories (name, sort_order)
  VALUES ('Amigos', 100)
  ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order
  RETURNING id
)
INSERT INTO public.challenge_subcategories (category_id, name, sort_order)
SELECT id, n.name, n.sort_order FROM new_cat,
  (VALUES ('Namoro', 1), ('Churrasco', 2), ('Casamento', 3), ('Quem vai preso primeiro?', 4)) AS n(name, sort_order)
ON CONFLICT DO NOTHING;

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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique ON public.profiles (cpf) WHERE cpf IS NOT NULL;
COMMENT ON COLUMN public.profiles.cpf IS 'CPF (apenas dígitos). Validado por algoritmo no servidor. Único por usuário, exigido no resgate de prêmios.';
-- 1. user_roles: block self-assignment. Only admins can INSERT/UPDATE/DELETE.
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. missions: only show active missions to the public.
DROP POLICY IF EXISTS "Anyone can view active missions" ON public.missions;
CREATE POLICY "Anyone can view active missions" ON public.missions
  FOR SELECT TO public
  USING (active = true);

-- Admins can still see all missions through the existing "Admins manage missions" ALL policy.

-- 3. signup_attempts: explicit anonymous block (defense in depth).
CREATE POLICY "Block anon reads on signup_attempts" ON public.signup_attempts
  AS RESTRICTIVE FOR SELECT TO anon
  USING (false);

-- 4. profiles: explicit admin SELECT policy so admins can read profiles through RLS.
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_platform_check;
ALTER TABLE public.missions ADD CONSTRAINT missions_platform_check CHECK (platform = ANY (ARRAY['instagram','youtube','google','facebook','tiktok']));
ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_action_type_check;
ALTER TABLE public.missions ADD CONSTRAINT missions_action_type_check CHECK (action_type = ANY (ARRAY['follow','like','comment','share','tag','review','like_comment','subscribe']));

-- 1. Restrictive policy on profiles to permanently block anon reads
CREATE POLICY "Block anon reads on profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 2. Lock down SECURITY DEFINER functions
-- Trigger-only functions: revoke from everyone (triggers run as table owner)
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies for authenticated users; keep auth, revoke others
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- ============ ENUMS ============
CREATE TYPE public.apuration_status AS ENUM (
  'aguardando_jogo',
  'jogo_em_andamento',
  'aguardando_resultado',
  'resultado_encontrado',
  'apurado_automaticamente',
  'requer_revisao_manual',
  'finalizado',
  'erro_na_consulta'
);

CREATE TYPE public.palpite_kind AS ENUM (
  'vencedor',
  'empate',
  'placar_exato',
  'mais_2',
  'menos_2',
  'ambos_marcam'
);

CREATE TYPE public.winner_payout_status AS ENUM (
  'pendente',
  'liberado',
  'aguardando_premio_fisico',
  'cancelado'
);

-- ============ CHALLENGES ============
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  prize_pool INTEGER NOT NULL DEFAULT 0,
  closes_at TIMESTAMPTZ,
  is_physical_prize BOOLEAN NOT NULL DEFAULT false,

  -- FIFA / partida
  fifa_match_url TEXT,
  fifa_match_id TEXT,
  home_team TEXT,
  away_team TEXT,
  home_flag_code TEXT,
  away_flag_code TEXT,
  match_date DATE,
  match_time TIME,
  match_kickoff TIMESTAMPTZ,
  match_status TEXT,
  home_score INTEGER,
  away_score INTEGER,
  winner_team TEXT,
  is_draw BOOLEAN,

  -- Apuração
  result_source TEXT,
  result_checked_at TIMESTAMPTZ,
  result_confirmed_at TIMESTAMPTZ,
  result_payload_json JSONB,
  apuration_status public.apuration_status NOT NULL DEFAULT 'aguardando_jogo',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenges_apuration_status ON public.challenges(apuration_status);
CREATE INDEX idx_challenges_match_kickoff ON public.challenges(match_kickoff);
CREATE INDEX idx_challenges_owner ON public.challenges(owner_id);

GRANT SELECT ON public.challenges TO anon;
GRANT SELECT, INSERT, UPDATE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges"
  ON public.challenges FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create challenges"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner or admin can update challenge"
  ON public.challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete challenges"
  ON public.challenges FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PALPITES ============
CREATE TABLE public.palpites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.palpite_kind NOT NULL,
  option_value TEXT,
  predicted_home_score INTEGER,
  predicted_away_score INTEGER,
  is_correct BOOLEAN,
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_palpites_challenge ON public.palpites(challenge_id);
CREATE INDEX idx_palpites_user ON public.palpites(user_id);

GRANT SELECT, INSERT ON public.palpites TO authenticated;
GRANT ALL ON public.palpites TO service_role;

ALTER TABLE public.palpites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User views own palpites"
  ON public.palpites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "User inserts own palpites"
  ON public.palpites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update palpites"
  ON public.palpites FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ RESULTS LOG ============
CREATE TABLE public.challenge_results_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT,
  confidence NUMERIC(4,3),
  status_at_check public.apuration_status,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_results_log_challenge ON public.challenge_results_log(challenge_id);

GRANT SELECT ON public.challenge_results_log TO authenticated;
GRANT ALL ON public.challenge_results_log TO service_role;

ALTER TABLE public.challenge_results_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads result logs"
  ON public.challenge_results_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ WINNERS ============
CREATE TABLE public.challenge_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  palpite_id UUID REFERENCES public.palpites(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 0,
  status public.winner_payout_status NOT NULL DEFAULT 'pendente',
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_winners_challenge ON public.challenge_winners(challenge_id);
CREATE INDEX idx_winners_user ON public.challenge_winners(user_id);
CREATE UNIQUE INDEX uniq_winner_per_palpite ON public.challenge_winners(palpite_id) WHERE palpite_id IS NOT NULL;

GRANT SELECT ON public.challenge_winners TO anon;
GRANT SELECT ON public.challenge_winners TO authenticated;
GRANT ALL ON public.challenge_winners TO service_role;

ALTER TABLE public.challenge_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view winners"
  ON public.challenge_winners FOR SELECT
  USING (true);

CREATE TRIGGER trg_winners_updated_at
  BEFORE UPDATE ON public.challenge_winners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TOKEN TRANSACTIONS ============
CREATE TABLE public.token_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES public.challenge_winners(id) ON DELETE SET NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_token_tx_user ON public.token_transactions(user_id);
CREATE INDEX idx_token_tx_challenge ON public.token_transactions(challenge_id);

GRANT SELECT ON public.token_transactions TO authenticated;
GRANT ALL ON public.token_transactions TO service_role;

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own token transactions"
  ON public.token_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Corporate challenges (cadastros de desafios de empresas)
CREATE TABLE public.corporate_challenges (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company_name TEXT,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  subs JSONB NOT NULL DEFAULT '[]'::jsonb,
  prize_name TEXT,
  logo_url TEXT,
  banner_url TEXT,
  instagram_arts JSONB NOT NULL DEFAULT '[]'::jsonb,
  tiebreaker TEXT,
  regulation TEXT,
  invite_reward_text TEXT,
  missions JSONB NOT NULL DEFAULT '[]'::jsonb,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ativo',
  participants INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.corporate_challenges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_challenges TO authenticated;
GRANT ALL ON public.corporate_challenges TO service_role;

ALTER TABLE public.corporate_challenges ENABLE ROW LEVEL SECURITY;

-- Anyone (visitors + signed-in) can read corporate challenges (public listings + share links)
CREATE POLICY "Corp challenges are public read"
  ON public.corporate_challenges FOR SELECT
  USING (true);

-- Only the authenticated creator can insert their own
CREATE POLICY "Owner can insert own corp challenge"
  ON public.corporate_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Owner or admin can update / delete
CREATE POLICY "Owner or admin can update corp challenge"
  ON public.corporate_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete corp challenge"
  ON public.corporate_challenges FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER corporate_challenges_set_updated_at
  BEFORE UPDATE ON public.corporate_challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX corporate_challenges_created_at_idx ON public.corporate_challenges (created_at DESC);
CREATE INDEX corporate_challenges_status_idx ON public.corporate_challenges (status);

CREATE POLICY "Public read corp-challenges"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'corp-challenges');

CREATE POLICY "Authenticated upload corp-challenges"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'corp-challenges');

CREATE POLICY "Owner update corp-challenges"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'corp-challenges' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'corp-challenges' AND owner = auth.uid());

CREATE POLICY "Owner delete corp-challenges"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'corp-challenges' AND owner = auth.uid());

-- Make CPF unique (one CPF per account)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique_idx
  ON public.profiles ((NULLIF(regexp_replace(cpf, '\D', '', 'g'), '')))
  WHERE cpf IS NOT NULL AND length(regexp_replace(cpf, '\D', '', 'g')) = 11;

-- Update handle_new_user to also persist cpf
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, whatsapp, instagram, cpf, avatar_url, provider, status,
    signup_ip, signup_city, terms_accepted_at, marketing_opt_in, welcome_bonus
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
    1000
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists (Supabase Auth → public.profiles)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Owner update avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "Owner delete avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());
WITH duplicates AS (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (PARTITION BY user_id, mission_id ORDER BY created_at ASC, id ASC) AS rn
    FROM public.mission_claims
  ) ranked
  WHERE rn > 1
)
DELETE FROM public.mission_claims mc
USING duplicates d
WHERE mc.id = d.id;

ALTER TABLE public.mission_claims
DROP CONSTRAINT IF EXISTS mission_claims_user_id_mission_id_context_key;

ALTER TABLE public.mission_claims
ADD CONSTRAINT mission_claims_user_id_mission_id_key UNIQUE (user_id, mission_id);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text;
-- 1. email_notifications: rastreia envios por participante
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  position integer,
  points integer,
  tokens integer,
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id, template)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_notifications TO authenticated;
GRANT ALL ON public.email_notifications TO service_role;

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email notifications"
  ON public.email_notifications FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own notifications"
  ON public.email_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_email_notif_challenge ON public.email_notifications(challenge_id);
CREATE INDEX idx_email_notif_user ON public.email_notifications(user_id);

CREATE TRIGGER trg_email_notif_updated_at
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. challenge_result_audit: histórico imutável de mudanças de resultado
CREATE TABLE IF NOT EXISTS public.challenge_result_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL,
  previous_result jsonb,
  new_result jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.challenge_result_audit TO authenticated;
GRANT ALL ON public.challenge_result_audit TO service_role;

ALTER TABLE public.challenge_result_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit"
  ON public.challenge_result_audit FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert audit"
  ON public.challenge_result_audit FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_result_audit_challenge ON public.challenge_result_audit(challenge_id);

-- 3. Idempotência no crédito de tokens (impede duplo crédito por winner)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_token_tx_per_winner
  ON public.token_transactions(winner_id)
  WHERE winner_id IS NOT NULL;

-- 4. Rastreia se já notificamos o vencedor
ALTER TABLE public.challenge_winners
  ADD COLUMN IF NOT EXISTS email_notified_at timestamptz;
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');

CREATE TABLE public.world_cup_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team text NOT NULL,
  away_team text NOT NULL,
  match_date date NOT NULL,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','em_andamento','encerrado')),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (home_team, away_team, match_date)
);

GRANT SELECT ON public.world_cup_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.world_cup_results TO authenticated;
GRANT ALL ON public.world_cup_results TO service_role;

ALTER TABLE public.world_cup_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read results"
ON public.world_cup_results FOR SELECT
USING (true);

CREATE POLICY "Admins can insert results"
ON public.world_cup_results FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update results"
ON public.world_cup_results FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete results"
ON public.world_cup_results FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_world_cup_results_updated_at
BEFORE UPDATE ON public.world_cup_results
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.world_cup_results (home_team, away_team, match_date, home_score, away_score, status) VALUES
('México','África do Sul','2026-06-11',2,0,'encerrado'),
('Coreia do Sul','República Tcheca','2026-06-11',2,1,'encerrado'),
('Canadá','Bósnia e Herzegovina','2026-06-12',1,1,'encerrado'),
('Estados Unidos','Paraguai','2026-06-12',4,1,'encerrado'),
('Catar','Suíça','2026-06-13',1,1,'encerrado'),
('Brasil','Marrocos','2026-06-13',1,1,'encerrado'),
('Haiti','Escócia','2026-06-13',0,1,'encerrado'),
('Austrália','Turquia','2026-06-14',2,0,'encerrado'),
('Alemanha','Curaçao','2026-06-14',7,1,'encerrado'),
('Holanda','Japão','2026-06-14',2,2,'encerrado'),
('Costa do Marfim','Equador','2026-06-14',1,0,'encerrado'),
('Suécia','Tunísia','2026-06-14',5,1,'encerrado'),
('Espanha','Cabo Verde','2026-06-15',0,0,'encerrado'),
('Bélgica','Egito','2026-06-15',1,1,'encerrado'),
('Arábia Saudita','Uruguai','2026-06-15',1,1,'encerrado'),
('Irã','Nova Zelândia','2026-06-15',2,2,'encerrado'),
('França','Senegal','2026-06-16',3,1,'encerrado'),
('Iraque','Noruega','2026-06-16',1,4,'encerrado'),
('Argentina','Argélia','2026-06-16',3,0,'encerrado'),
('Áustria','Jordânia','2026-06-17',3,1,'encerrado'),
('Portugal','República Democrática do Congo','2026-06-17',1,1,'encerrado'),
('Inglaterra','Croácia','2026-06-17',4,2,'encerrado'),
('Gana','Panamá','2026-06-17',1,0,'encerrado'),
('Uzbequistão','Colômbia','2026-06-17',1,3,'encerrado'),
('República Tcheca','África do Sul','2026-06-18',1,1,'encerrado'),
('Suíça','Bósnia e Herzegovina','2026-06-18',4,1,'encerrado'),
('Canadá','Catar','2026-06-18',6,0,'encerrado'),
('México','Coreia do Sul','2026-06-18',1,0,'encerrado'),
('Estados Unidos','Austrália','2026-06-19',2,0,'encerrado'),
('Escócia','Marrocos','2026-06-19',0,1,'encerrado'),
('Brasil','Haiti','2026-06-19',3,0,'encerrado'),
('Turquia','Paraguai','2026-06-19',0,1,'encerrado'),
('Holanda','Suécia','2026-06-20',5,1,'encerrado'),
('Alemanha','Costa do Marfim','2026-06-20',2,1,'encerrado'),
('Equador','Curaçao','2026-06-20',0,0,'encerrado'),
('Tunísia','Japão','2026-06-21',0,4,'encerrado'),
('Espanha','Arábia Saudita','2026-06-21',4,0,'encerrado'),
('Bélgica','Irã','2026-06-21',0,0,'encerrado'),
('Uruguai','Cabo Verde','2026-06-21',2,2,'encerrado'),
('Nova Zelândia','Egito','2026-06-21',1,3,'encerrado'),
('Argentina','Áustria','2026-06-22',0,0,'em_andamento');

CREATE POLICY "Public can read match-results"
ON storage.objects FOR SELECT
USING (bucket_id = 'match-results');

CREATE POLICY "Admins can upload match-results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'match-results' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update match-results"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'match-results' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete match-results"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'match-results' AND public.has_role(auth.uid(), 'admin'));
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
  END LOOP;
END $$;

-- Anon read for tables with permissive public-read policies
GRANT SELECT ON public.corporate_challenges TO anon;
GRANT SELECT ON public.challenges TO anon;
GRANT SELECT ON public.challenge_categories TO anon;
GRANT SELECT ON public.challenge_subcategories TO anon;
GRANT SELECT ON public.world_cup_results TO anon;
GRANT SELECT ON public.challenge_winners TO anon;
GRANT SELECT ON public.missions TO anon;

-- Admin prizes catalog
CREATE TABLE public.admin_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  estimated_value numeric(10,2),
  stock integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_prizes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_prizes TO authenticated;
GRANT ALL ON public.admin_prizes TO service_role;
ALTER TABLE public.admin_prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can view active prizes" ON public.admin_prizes FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage prizes" ON public.admin_prizes FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_admin_prizes_updated_at BEFORE UPDATE ON public.admin_prizes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Challenge ratings (5 stars)
CREATE TABLE public.challenge_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);
GRANT SELECT ON public.challenge_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_ratings TO authenticated;
GRANT ALL ON public.challenge_ratings TO service_role;
ALTER TABLE public.challenge_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings public read" ON public.challenge_ratings FOR SELECT USING (true);
CREATE POLICY "users insert own rating" ON public.challenge_ratings FOR INSERT WITH CHECK (auth.uid() = user_id AND rating BETWEEN 1 AND 5);
CREATE POLICY "users update own rating" ON public.challenge_ratings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND rating BETWEEN 1 AND 5);
CREATE POLICY "users delete own rating" ON public.challenge_ratings FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_challenge_ratings_updated_at BEFORE UPDATE ON public.challenge_ratings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Top 100 monthly snapshots
CREATE TABLE public.top100_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key text NOT NULL,
  user_id uuid NOT NULL,
  challenges_count integer NOT NULL DEFAULT 0,
  total_participants integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  rank integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_key, user_id)
);
GRANT SELECT ON public.top100_snapshots TO anon, authenticated;
GRANT ALL ON public.top100_snapshots TO service_role;
ALTER TABLE public.top100_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "top100 public read" ON public.top100_snapshots FOR SELECT USING (true);

CREATE TABLE public.instagram_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  instagram_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_tokens INT NOT NULL DEFAULT 5000,
  reward_palpite_tokens INT NOT NULL DEFAULT 4,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT ON public.instagram_submissions TO authenticated;
GRANT ALL ON public.instagram_submissions TO service_role;

ALTER TABLE public.instagram_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own submissions"
  ON public.instagram_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their own submissions"
  ON public.instagram_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all"
  ON public.instagram_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all"
  ON public.instagram_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- News system
CREATE TABLE public.news_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_categories TO authenticated;
GRANT ALL ON public.news_categories TO service_role;
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads categories" ON public.news_categories FOR SELECT USING (true);
CREATE POLICY "admins manage categories" ON public.news_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.news_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.news_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);
GRANT SELECT ON public.news_subcategories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_subcategories TO authenticated;
GRANT ALL ON public.news_subcategories TO service_role;
ALTER TABLE public.news_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads subcategories" ON public.news_subcategories FOR SELECT USING (true);
CREATE POLICY "admins manage subcategories" ON public.news_subcategories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  body text NOT NULL,
  cover_url text,
  source_url text,
  category_id uuid REFERENCES public.news_categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES public.news_subcategories(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  seo_title text,
  seo_description text,
  seo_keywords text,
  related_challenge_ids uuid[] DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  auto_generated boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  views_count int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX news_articles_published_idx ON public.news_articles(published, published_at DESC);
CREATE INDEX news_articles_category_idx ON public.news_articles(category_id);
GRANT SELECT ON public.news_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_articles TO authenticated;
GRANT ALL ON public.news_articles TO service_role;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads published news" ON public.news_articles FOR SELECT USING (published = true);
CREATE POLICY "admins read all news" ON public.news_articles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage news" ON public.news_articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER news_articles_updated_at BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.news_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);
GRANT SELECT ON public.news_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_ratings TO authenticated;
GRANT ALL ON public.news_ratings TO service_role;
ALTER TABLE public.news_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads ratings" ON public.news_ratings FOR SELECT USING (true);
CREATE POLICY "users manage own rating" ON public.news_ratings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.news_instagram_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tokens_awarded int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(article_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_instagram_shares TO authenticated;
GRANT ALL ON public.news_instagram_shares TO service_role;
ALTER TABLE public.news_instagram_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own shares" ON public.news_instagram_shares FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users create own shares" ON public.news_instagram_shares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins update shares" ON public.news_instagram_shares FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed a few default categories
INSERT INTO public.news_categories (name, slug) VALUES
  ('Futebol', 'futebol'),
  ('Copa do Mundo', 'copa-do-mundo'),
  ('Entretenimento', 'entretenimento'),
  ('Política', 'politica')
ON CONFLICT (slug) DO NOTHING;

-- 1) Add cost_tokens to admin_prizes
ALTER TABLE public.admin_prizes
  ADD COLUMN IF NOT EXISTS cost_tokens integer NOT NULL DEFAULT 0;

-- 2) Prize redemption requests
CREATE TABLE IF NOT EXISTS public.prize_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_id uuid NOT NULL REFERENCES public.admin_prizes(id) ON DELETE RESTRICT,
  prize_name text NOT NULL,
  cost_tokens integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  request_ip text,
  ai_fraud_report jsonb,
  ai_fraud_score integer,
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.prize_redemptions TO authenticated;
GRANT ALL ON public.prize_redemptions TO service_role;

ALTER TABLE public.prize_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own redemptions"
  ON public.prize_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own redemptions"
  ON public.prize_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update redemptions"
  ON public.prize_redemptions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER prize_redemptions_set_updated_at
  BEFORE UPDATE ON public.prize_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS prize_redemptions_user_idx ON public.prize_redemptions(user_id);
CREATE INDEX IF NOT EXISTS prize_redemptions_status_idx ON public.prize_redemptions(status);

-- 1) Avatars: require first folder = user id
DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
CREATE POLICY "Authenticated upload avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2) Corp-challenges: require first folder = user id
DROP POLICY IF EXISTS "Authenticated upload corp-challenges" ON storage.objects;
CREATE POLICY "Authenticated upload corp-challenges" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'corp-challenges'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) challenge_winners: restrict public read
DROP POLICY IF EXISTS "Anyone can view winners" ON public.challenge_winners;
CREATE POLICY "Owners read own winner rows" ON public.challenge_winners
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 4) email_notifications: admins only (drop user read)
DROP POLICY IF EXISTS "Users read own notifications" ON public.email_notifications;

-- 5) top100_snapshots: drop public read (server functions use service role)
DROP POLICY IF EXISTS "top100 public read" ON public.top100_snapshots;

-- 6) Fix SECURITY DEFINER functions: set search_path and revoke from anon/public
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- Competitions
CREATE TABLE public.football_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  season INTEGER,
  active BOOLEAN NOT NULL DEFAULT false,
  sync_frequency TEXT NOT NULL DEFAULT 'daily',
  auto_create_challenges BOOLEAN NOT NULL DEFAULT false,
  auto_update_results BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.football_competitions TO authenticated;
GRANT ALL ON public.football_competitions TO service_role;
ALTER TABLE public.football_competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage competitions" ON public.football_competitions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_football_competitions_updated BEFORE UPDATE ON public.football_competitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Matches
CREATE TABLE public.football_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_match_id TEXT NOT NULL UNIQUE,
  competition_code TEXT NOT NULL,
  competition_name TEXT,
  season INTEGER,
  matchday INTEGER,
  stage TEXT,
  group_name TEXT,
  utc_date TIMESTAMPTZ NOT NULL,
  data_hora_brasil TIMESTAMPTZ,
  home_team_id INTEGER,
  home_team_name TEXT,
  home_team_crest TEXT,
  away_team_id INTEGER,
  away_team_name TEXT,
  away_team_crest TEXT,
  status TEXT NOT NULL,
  score_home INTEGER,
  score_away INTEGER,
  winner TEXT,
  last_updated_api TIMESTAMPTZ,
  linked_challenge_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_football_matches_competition ON public.football_matches(competition_code);
CREATE INDEX idx_football_matches_status ON public.football_matches(status);
CREATE INDEX idx_football_matches_utc_date ON public.football_matches(utc_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.football_matches TO authenticated;
GRANT ALL ON public.football_matches TO service_role;
ALTER TABLE public.football_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage matches" ON public.football_matches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_football_matches_updated BEFORE UPDATE ON public.football_matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sync logs
CREATE TABLE public.football_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_code TEXT,
  endpoint TEXT,
  http_status INTEGER,
  imported INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_football_sync_logs_created ON public.football_sync_logs(created_at DESC);
GRANT SELECT, INSERT ON public.football_sync_logs TO authenticated;
GRANT ALL ON public.football_sync_logs TO service_role;
ALTER TABLE public.football_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read logs" ON public.football_sync_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert logs" ON public.football_sync_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Challenges: source + external link
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS external_match_id TEXT;
CREATE INDEX IF NOT EXISTS idx_challenges_external_match ON public.challenges(external_match_id);

-- Seed 12 free competitions (all inactive by default)
INSERT INTO public.football_competitions (code, name, season, active) VALUES
  ('WC',  'FIFA World Cup', 2026, false),
  ('CL',  'UEFA Champions League', 2025, false),
  ('BL1', 'Bundesliga', 2025, false),
  ('DED', 'Eredivisie', 2025, false),
  ('BSA', 'Campeonato Brasileiro Série A', 2025, false),
  ('PD',  'Primera Division', 2025, false),
  ('FL1', 'Ligue 1', 2025, false),
  ('ELC', 'Championship', 2025, false),
  ('PPL', 'Primeira Liga', 2025, false),
  ('EC',  'European Championship', 2024, false),
  ('SA',  'Serie A', 2025, false),
  ('PL',  'Premier League', 2025, false)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS palpite_credits integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.palpite_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  reason text NOT NULL,
  mission_id uuid,
  challenge_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.palpite_credit_transactions TO authenticated;
GRANT ALL ON public.palpite_credit_transactions TO service_role;

ALTER TABLE public.palpite_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credit transactions"
  ON public.palpite_credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_palpite_credit_tx_user ON public.palpite_credit_transactions(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.grant_palpite_credit(
  _user_id uuid,
  _delta integer,
  _reason text,
  _mission_id uuid DEFAULT NULL,
  _challenge_id text DEFAULT NULL
) RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  IF _delta IS NULL OR _delta = 0 THEN
    SELECT palpite_credits INTO new_balance FROM public.profiles WHERE id = _user_id;
    RETURN COALESCE(new_balance, 0);
  END IF;

  -- For mission claims, ensure idempotency (one grant per mission per user)
  IF _mission_id IS NOT NULL AND _reason = 'mission_claim' THEN
    IF EXISTS (
      SELECT 1 FROM public.palpite_credit_transactions
      WHERE user_id = _user_id AND mission_id = _mission_id AND reason = 'mission_claim'
    ) THEN
      SELECT palpite_credits INTO new_balance FROM public.profiles WHERE id = _user_id;
      RETURN COALESCE(new_balance, 0);
    END IF;
  END IF;

  UPDATE public.profiles
    SET palpite_credits = GREATEST(0, COALESCE(palpite_credits, 0) + _delta)
    WHERE id = _user_id
    RETURNING palpite_credits INTO new_balance;

  INSERT INTO public.palpite_credit_transactions(user_id, delta, reason, mission_id, challenge_id)
    VALUES (_user_id, _delta, _reason, _mission_id, _challenge_id);

  RETURN COALESCE(new_balance, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_palpite_credit(uuid, integer, text, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.grant_palpite_credit(uuid, integer, text, uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.grant_palpite_credit(uuid, integer, text, uuid, text) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.grant_palpite_credit(uuid, integer, text, uuid, text) TO service_role;

-- 1. email_unsubscribe_tokens: add DELETE policy for service_role cleanup
CREATE POLICY "Service role can delete tokens"
  ON public.email_unsubscribe_tokens
  FOR DELETE
  USING (auth.role() = 'service_role');

-- 2. football_matches: allow authenticated + anon read of public match data
GRANT SELECT ON public.football_matches TO anon, authenticated;
CREATE POLICY "Public can read football matches"
  ON public.football_matches
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. top100_snapshots: explicit read policy for the public leaderboard
GRANT SELECT ON public.top100_snapshots TO anon, authenticated;
CREATE POLICY "Public can read top100 snapshots"
  ON public.top100_snapshots
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public.mystery_box_opens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL DEFAULT now(),
  tokens_awarded integer NOT NULL,
  streak_day integer NOT NULL DEFAULT 1,
  bonus_awarded integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_mystery_box_user ON public.mystery_box_opens(user_id, opened_at DESC);

GRANT SELECT ON public.mystery_box_opens TO authenticated;
GRANT ALL ON public.mystery_box_opens TO service_role;

ALTER TABLE public.mystery_box_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own mystery box opens"
  ON public.mystery_box_opens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.open_mystery_box(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_open timestamptz;
  last_streak integer;
  next_streak integer;
  base_reward integer;
  loyalty_bonus integer;
  milestone_bonus integer := 0;
  total integer;
  new_id uuid;
  next_available timestamptz;
BEGIN
  SELECT opened_at, streak_day INTO last_open, last_streak
    FROM public.mystery_box_opens
    WHERE user_id = _user_id
    ORDER BY opened_at DESC
    LIMIT 1;

  IF last_open IS NOT NULL AND last_open > now() - interval '24 hours' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'cooldown',
      'next_available_at', (last_open + interval '24 hours')
    );
  END IF;

  -- Streak: if last open was within 48h (i.e., 24-48h ago), continue. Else reset.
  IF last_open IS NOT NULL AND last_open > now() - interval '48 hours' THEN
    next_streak := COALESCE(last_streak, 0) + 1;
  ELSE
    next_streak := 1;
  END IF;

  base_reward := 100 + floor(random() * 401)::int; -- 100..500
  loyalty_bonus := LEAST(next_streak * 15, 500); -- até +500 conforme fidelidade

  IF next_streak >= 30 THEN
    milestone_bonus := 20000;
    next_streak := 0; -- reseta ciclo após resgatar
  END IF;

  total := base_reward + loyalty_bonus + milestone_bonus;

  INSERT INTO public.mystery_box_opens(user_id, tokens_awarded, streak_day, bonus_awarded)
    VALUES (_user_id, total, GREATEST(next_streak, 1), loyalty_bonus + milestone_bonus)
    RETURNING id INTO new_id;

  INSERT INTO public.token_transactions(user_id, delta, reason)
    VALUES (_user_id, total, 'mystery_box');

  next_available := now() + interval '24 hours';

  RETURN jsonb_build_object(
    'ok', true,
    'tokens', total,
    'base', base_reward,
    'loyalty_bonus', loyalty_bonus,
    'milestone_bonus', milestone_bonus,
    'streak_day', GREATEST(next_streak, 1),
    'next_available_at', next_available
  );
END;
$$;

REVOKE ALL ON FUNCTION public.open_mystery_box(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_mystery_box(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.open_mystery_box(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
DROP POLICY IF EXISTS "Users create own claims" ON public.mission_claims;

CREATE POLICY "Users create own claims" ON public.mission_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND tokens_awarded >= 0
    AND tokens_awarded <= (
      SELECT COALESCE(m.tokens, 0) + COALESCE(m.bonus_tokens, 0) + 200
      FROM public.missions m
      WHERE m.id = mission_claims.mission_id AND m.active = true
    )
  );
-- Complete e-mail marketing model built on top of the existing Resend/Lovable
-- queue infrastructure. Idempotent by design so it can be applied safely.

CREATE TABLE IF NOT EXISTS public.email_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  cidade TEXT,
  estado TEXT,
  pais TEXT NOT NULL DEFAULT 'BR',
  idioma TEXT NOT NULL DEFAULT 'pt-BR',
  origem TEXT NOT NULL DEFAULT 'Usuario',
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'inativo', 'opt-out', 'bounce', 'spam')),
  data_cadastro TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_login TIMESTAMPTZ,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_creditos INTEGER NOT NULL DEFAULT 0,
  desafios_criados INTEGER NOT NULL DEFAULT 0,
  desafios_participados INTEGER NOT NULL DEFAULT 0,
  convites_realizados INTEGER NOT NULL DEFAULT 0,
  ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.email_preferences (
  contato_id UUID PRIMARY KEY REFERENCES public.email_contacts(id) ON DELETE CASCADE,
  novos_desafios BOOLEAN NOT NULL DEFAULT true,
  promocoes BOOLEAN NOT NULL DEFAULT true,
  missoes BOOLEAN NOT NULL DEFAULT true,
  tokens BOOLEAN NOT NULL DEFAULT true,
  convites BOOLEAN NOT NULL DEFAULT true,
  brindes BOOLEAN NOT NULL DEFAULT true,
  eventos BOOLEAN NOT NULL DEFAULT true,
  atualizacoes BOOLEAN NOT NULL DEFAULT true,
  newsletter BOOLEAN NOT NULL DEFAULT true,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (
    categoria IN (
      'Boas-vindas',
      'Promocao',
      'Novo desafio',
      'Tokens',
      'Missoes',
      'Premios',
      'Newsletter',
      'Institucional'
    )
  ),
  assunto TEXT NOT NULL,
  html TEXT NOT NULL,
  json_layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'rascunho', 'arquivado')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  assunto TEXT NOT NULL,
  template UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  segmento JSONB NOT NULL DEFAULT '{"type":"todos"}'::jsonb,
  status TEXT NOT NULL DEFAULT 'Rascunho'
    CHECK (status IN ('Rascunho', 'Agendada', 'Enviando', 'Finalizada', 'Cancelada')),
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agendamento TIMESTAMPTZ,
  data_envio TIMESTAMPTZ,
  remetente TEXT,
  responder_para TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_campaign_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contato UUID REFERENCES public.email_contacts(id) ON DELETE SET NULL,
  message_id TEXT,
  enviado BOOLEAN NOT NULL DEFAULT false,
  entregue BOOLEAN NOT NULL DEFAULT false,
  aberto BOOLEAN NOT NULL DEFAULT false,
  clicado BOOLEAN NOT NULL DEFAULT false,
  bounce BOOLEAN NOT NULL DEFAULT false,
  spam BOOLEAN NOT NULL DEFAULT false,
  cancelou BOOLEAN NOT NULL DEFAULT false,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_evento TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (campanha, contato)
);

CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'resend',
  event_type TEXT NOT NULL,
  message_id TEXT,
  campanha UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  contato UUID REFERENCES public.email_contacts(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  recebido_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contato UUID REFERENCES public.email_contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'enfileirado', 'enviado', 'erro', 'cancelado', 'suprimido')),
  tentativas INTEGER NOT NULL DEFAULT 0,
  data_execucao TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_id TEXT,
  erro TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha, contato)
);

CREATE INDEX IF NOT EXISTS idx_email_contacts_status ON public.email_contacts(status);
CREATE INDEX IF NOT EXISTS idx_email_contacts_user ON public.email_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_contacts_location ON public.email_contacts(cidade, estado, pais);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_message ON public.email_campaign_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_message ON public.email_events(message_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_exec ON public.email_queue(status, data_execucao);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_contacts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_preferences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaign_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_queue TO service_role;

ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins manage email contacts" ON public.email_contacts
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own email contact" ON public.email_contacts
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email preferences" ON public.email_preferences
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own email preferences" ON public.email_preferences
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.email_contacts c
        WHERE c.id = contato_id AND c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email templates" ON public.email_templates
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email campaigns" ON public.email_campaigns
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read email campaign logs" ON public.email_campaign_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read email events" ON public.email_events
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read email queue" ON public.email_queue
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email contacts" ON public.email_contacts
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email preferences" ON public.email_preferences
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email templates" ON public.email_templates
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email campaigns" ON public.email_campaigns
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email campaign logs" ON public.email_campaign_logs
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email events" ON public.email_events
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email queue" ON public.email_queue
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.touch_email_marketing_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'email_contacts' THEN
    NEW.ultima_atualizacao = now();
  ELSIF TG_TABLE_NAME = 'email_preferences' THEN
    NEW.atualizado_em = now();
  ELSIF TG_TABLE_NAME = 'email_templates' THEN
    NEW.atualizado_em = now();
  ELSIF TG_TABLE_NAME = 'email_campaigns' THEN
    NEW.atualizado_em = now();
  ELSIF TG_TABLE_NAME = 'email_queue' THEN
    NEW.atualizado_em = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_contacts_touch ON public.email_contacts;
CREATE TRIGGER trg_email_contacts_touch
  BEFORE UPDATE ON public.email_contacts
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_preferences_touch ON public.email_preferences;
CREATE TRIGGER trg_email_preferences_touch
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_templates_touch ON public.email_templates;
CREATE TRIGGER trg_email_templates_touch
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_campaigns_touch ON public.email_campaigns;
CREATE TRIGGER trg_email_campaigns_touch
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_queue_touch ON public.email_queue;
CREATE TRIGGER trg_email_queue_touch
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

CREATE OR REPLACE FUNCTION public.sync_profile_to_email_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contact_id UUID;
BEGIN
  IF NEW.email IS NULL OR length(trim(NEW.email)) = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.email_contacts (
    user_id,
    nome,
    email,
    telefone,
    cidade,
    estado,
    pais,
    idioma,
    origem,
    status,
    data_cadastro,
    ultimo_login,
    total_tokens,
    total_creditos
  )
  VALUES (
    NEW.id,
    NEW.full_name,
    lower(trim(NEW.email)),
    NEW.whatsapp,
    COALESCE(NEW.cidade, NEW.signup_city),
    NEW.estado,
    'BR',
    'pt-BR',
    'Usuario',
    CASE WHEN NEW.status = 'inactive' THEN 'inativo' ELSE 'ativo' END,
    COALESCE(NEW.created_at, now()),
    now(),
    COALESCE(NEW.welcome_bonus, 0),
    COALESCE(NEW.palpite_credits, 0)
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, public.email_contacts.user_id),
    nome = COALESCE(EXCLUDED.nome, public.email_contacts.nome),
    telefone = COALESCE(EXCLUDED.telefone, public.email_contacts.telefone),
    cidade = COALESCE(EXCLUDED.cidade, public.email_contacts.cidade),
    estado = COALESCE(EXCLUDED.estado, public.email_contacts.estado),
    ultimo_login = now(),
    total_tokens = EXCLUDED.total_tokens,
    total_creditos = EXCLUDED.total_creditos,
    status = CASE
      WHEN public.email_contacts.status IN ('opt-out', 'bounce', 'spam') THEN public.email_contacts.status
      ELSE EXCLUDED.status
    END,
    ultima_atualizacao = now()
  RETURNING id INTO contact_id;

  INSERT INTO public.email_preferences (contato_id)
  VALUES (contact_id)
  ON CONFLICT (contato_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_email_contact_insert ON public.profiles;
CREATE TRIGGER trg_profiles_email_contact_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_email_contact();

DROP TRIGGER IF EXISTS trg_profiles_email_contact_update ON public.profiles;
CREATE TRIGGER trg_profiles_email_contact_update
  AFTER UPDATE OF full_name, email, whatsapp, cidade, estado, signup_city, status, welcome_bonus, palpite_credits
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_email_contact();

INSERT INTO public.email_templates (nome, categoria, assunto, html, json_layout, status)
VALUES (
  'Preferencias de comunicacao',
  'Institucional',
  'Escolha quais comunicacoes deseja receber',
  '<h1>Oi, {{nome}}!</h1><p>Queremos enviar apenas o que importa para voce no Desafio dos Palpites.</p><p><a href="{{link_preferencias}}">Atualizar minhas preferencias</a></p>',
  '[{"type":"logo"},{"type":"text","content":"Oi, {{nome}}!"},{"type":"button","label":"Atualizar preferencias","href":"{{link_preferencias}}"},{"type":"footer"}]'::jsonb,
  'ativo'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.email_templates (nome, categoria, assunto, html, json_layout, status)
VALUES (
  'Newsletter semanal',
  'Newsletter',
  'Novidades do Desafio dos Palpites',
  '<h1>Novidades para voce, {{nome}}</h1><p>Veja desafios, missoes e premios em destaque.</p><p><a href="{{link}}">Abrir o Desafio dos Palpites</a></p>',
  '[{"type":"logo"},{"type":"banner","content":"Novidades da semana"},{"type":"cards"},{"type":"button","label":"Participar agora","href":"{{link}}"},{"type":"footer"}]'::jsonb,
  'ativo'
)
ON CONFLICT DO NOTHING;
-- Sprint 2 - Central de Comunicacao: modelagem do banco de emails.
-- Escopo: somente banco de dados.

CREATE TABLE IF NOT EXISTS public.email_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'resend',
  from_email text,
  from_name text,
  reply_to text,
  domain text,
  is_default boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'info',
  queue_id uuid REFERENCES public.email_queue(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES public.email_providers(id) ON DELETE SET NULL,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.email_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  data_type text NOT NULL DEFAULT 'text',
  default_value text,
  example_value text,
  is_required boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS key text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS preheader text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS html_body text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS text_body text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS variables_schema jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.email_providers(id) ON DELETE SET NULL;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS audience jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS finished_at timestamptz;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'queued';
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.email_providers(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS to_email text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS html_body text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS text_body text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS variables jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS processed_at timestamptz;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS provider_message_id text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'received';
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS queue_id uuid REFERENCES public.email_queue(id) ON DELETE SET NULL;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.email_providers(id) ON DELETE SET NULL;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS provider_event_id text;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS provider_message_id text;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'transactional';
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email';
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS opted_in boolean NOT NULL DEFAULT true;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS opted_out_at timestamptz;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS opt_out_reason text;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.email_preferences SET id = COALESCE(id, gen_random_uuid()) WHERE id IS NULL;
ALTER TABLE public.email_preferences ALTER COLUMN id SET NOT NULL;

UPDATE public.email_templates
SET created_at = COALESCE(created_at, criado_em, now()),
    updated_at = COALESCE(updated_at, atualizado_em, now()),
    name = COALESCE(name, nome),
    html_body = COALESCE(html_body, html)
WHERE created_at IS NULL OR updated_at IS NULL OR name IS NULL OR html_body IS NULL;

UPDATE public.email_campaigns
SET created_at = COALESCE(created_at, criado_em, now()),
    updated_at = COALESCE(updated_at, atualizado_em, now()),
    created_by = COALESCE(created_by, criado_por),
    template_id = COALESCE(template_id, template),
    scheduled_at = COALESCE(scheduled_at, agendamento)
WHERE created_at IS NULL OR updated_at IS NULL OR created_by IS NULL OR template_id IS NULL OR scheduled_at IS NULL;

UPDATE public.email_queue
SET created_at = COALESCE(created_at, criado_em, now()),
    updated_at = COALESCE(updated_at, atualizado_em, now()),
    campaign_id = COALESCE(campaign_id, campanha),
    scheduled_at = COALESCE(scheduled_at, data_execucao),
    attempts = COALESCE(attempts, tentativas),
    provider_message_id = COALESCE(provider_message_id, message_id),
    last_error = COALESCE(last_error, erro)
WHERE created_at IS NULL OR updated_at IS NULL OR campaign_id IS NULL OR provider_message_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_providers_default_unique ON public.email_providers(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_email_providers_status ON public.email_providers(status);
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON public.email_templates(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_key_unique ON public.email_templates(key) WHERE key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status_scheduled ON public.email_campaigns(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_template_id ON public.email_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_at, priority);
CREATE INDEX IF NOT EXISTS idx_email_queue_campaign_id ON public.email_queue(campaign_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_queue_idempotency_unique ON public.email_queue(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_status_created_at ON public.email_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_queue_id ON public.email_logs(queue_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_events_provider_event_unique ON public.email_events(provider, provider_event_id) WHERE provider_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_events_status_created_at ON public.email_events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_provider_message_id ON public.email_events(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_category ON public.email_preferences(user_id, category, channel);
CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON public.email_preferences(email);
CREATE INDEX IF NOT EXISTS idx_email_variables_status ON public.email_variables(status);
CREATE INDEX IF NOT EXISTS idx_email_variables_category ON public.email_variables(category);

DROP TRIGGER IF EXISTS set_email_providers_updated_at ON public.email_providers;
CREATE TRIGGER set_email_providers_updated_at BEFORE UPDATE ON public.email_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER set_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_campaigns_updated_at ON public.email_campaigns;
CREATE TRIGGER set_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_queue_updated_at ON public.email_queue;
CREATE TRIGGER set_email_queue_updated_at BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER set_email_logs_updated_at BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_events_updated_at ON public.email_events;
CREATE TRIGGER set_email_events_updated_at BEFORE UPDATE ON public.email_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_preferences_updated_at ON public.email_preferences;
CREATE TRIGGER set_email_preferences_updated_at BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_variables_updated_at ON public.email_variables;
CREATE TRIGGER set_email_variables_updated_at BEFORE UPDATE ON public.email_variables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_variables TO authenticated;

GRANT ALL ON public.email_providers TO service_role;
GRANT ALL ON public.email_templates TO service_role;
GRANT ALL ON public.email_campaigns TO service_role;
GRANT ALL ON public.email_queue TO service_role;
GRANT ALL ON public.email_logs TO service_role;
GRANT ALL ON public.email_events TO service_role;
GRANT ALL ON public.email_preferences TO service_role;
GRANT ALL ON public.email_variables TO service_role;

ALTER TABLE public.email_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_variables ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins manage email providers" ON public.email_providers
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email templates" ON public.email_templates
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email campaigns" ON public.email_campaigns
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email queue" ON public.email_queue
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email logs" ON public.email_logs
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email events" ON public.email_events
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email preferences" ON public.email_preferences
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users read own central email preferences" ON public.email_preferences
    FOR SELECT TO authenticated
    USING (
      user_id = auth.uid()
      OR created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.email_contacts c WHERE c.id = contato_id AND c.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own central email preferences" ON public.email_preferences
    FOR UPDATE TO authenticated
    USING (
      user_id = auth.uid()
      OR created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.email_contacts c WHERE c.id = contato_id AND c.user_id = auth.uid())
    )
    WITH CHECK (
      user_id = auth.uid()
      OR created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.email_contacts c WHERE c.id = contato_id AND c.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email variables" ON public.email_variables
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email providers" ON public.email_providers
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email logs" ON public.email_logs
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email variables" ON public.email_variables
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.email_providers IS 'Provedores de e-mail da Central de Comunicacao, incluindo Resend.';
COMMENT ON TABLE public.email_templates IS 'Templates de e-mail utilizados por comunicacoes transacionais, marketing, newsletter e campanhas automaticas.';
COMMENT ON TABLE public.email_campaigns IS 'Campanhas de e-mail da Central de Comunicacao.';
COMMENT ON TABLE public.email_queue IS 'Fila centralizada de mensagens de e-mail antes do envio pelo provedor.';
COMMENT ON TABLE public.email_logs IS 'Logs internos de processamento, auditoria e erros da Central de Comunicacao.';
COMMENT ON TABLE public.email_events IS 'Eventos recebidos de provedores de e-mail, como delivered, opened, clicked, bounced e complained.';
COMMENT ON TABLE public.email_preferences IS 'Preferencias de recebimento de e-mails por usuario, contato, categoria e canal.';
COMMENT ON TABLE public.email_variables IS 'Catalogo de variaveis disponiveis para renderizacao de templates de e-mail.';

COMMENT ON COLUMN public.email_providers.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_providers.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_providers.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_providers.created_by IS 'Usuario que criou o registro.';
COMMENT ON COLUMN public.email_providers.status IS 'Status do registro.';
COMMENT ON COLUMN public.email_providers.config IS 'Configuracoes nao sensiveis do provedor. Chaves secretas devem ficar em variaveis de ambiente.';

COMMENT ON COLUMN public.email_templates.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_templates.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_templates.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_templates.created_by IS 'Usuario que criou o registro.';
COMMENT ON COLUMN public.email_templates.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_campaigns.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_campaigns.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_campaigns.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_campaigns.created_by IS 'Usuario que criou o registro.';
COMMENT ON COLUMN public.email_campaigns.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_queue.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_queue.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_queue.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_queue.created_by IS 'Usuario ou processo que criou o registro.';
COMMENT ON COLUMN public.email_queue.status IS 'Status do registro.';
COMMENT ON COLUMN public.email_queue.idempotency_key IS 'Chave de idempotencia para evitar envios duplicados.';

COMMENT ON COLUMN public.email_logs.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_logs.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_logs.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_logs.created_by IS 'Usuario ou processo que criou o registro.';
COMMENT ON COLUMN public.email_logs.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_events.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_events.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_events.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_events.created_by IS 'Usuario ou processo que criou o registro.';
COMMENT ON COLUMN public.email_events.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_preferences.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_preferences.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_preferences.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_preferences.created_by IS 'Usuario ou processo que criou o registro.';
COMMENT ON COLUMN public.email_preferences.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_variables.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_variables.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_variables.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_variables.created_by IS 'Usuario que criou o registro.';
COMMENT ON COLUMN public.email_variables.status IS 'Status do registro.';
