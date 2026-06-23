
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
