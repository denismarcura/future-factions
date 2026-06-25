
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
