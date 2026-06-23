
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
