
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
