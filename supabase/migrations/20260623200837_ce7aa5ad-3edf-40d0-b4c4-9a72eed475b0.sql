
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
