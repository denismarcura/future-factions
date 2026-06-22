
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
