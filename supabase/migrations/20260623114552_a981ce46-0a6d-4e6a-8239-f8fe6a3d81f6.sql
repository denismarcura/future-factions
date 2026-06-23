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