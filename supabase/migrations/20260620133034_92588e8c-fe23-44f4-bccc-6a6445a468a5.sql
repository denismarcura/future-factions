
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
