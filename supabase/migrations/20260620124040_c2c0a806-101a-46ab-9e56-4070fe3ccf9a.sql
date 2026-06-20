
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
