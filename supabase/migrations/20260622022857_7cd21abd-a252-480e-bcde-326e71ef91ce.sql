
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
