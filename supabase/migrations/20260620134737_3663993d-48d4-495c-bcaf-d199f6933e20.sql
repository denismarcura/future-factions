
-- 1. Restrict missions management to admins
DROP POLICY IF EXISTS "Authenticated users can manage missions" ON public.missions;
CREATE POLICY "Admins manage missions" ON public.missions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Lock tokens_awarded on mission_claims to the mission's tokens value
DROP POLICY IF EXISTS "Users create own claims" ON public.mission_claims;
CREATE POLICY "Users create own claims" ON public.mission_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND tokens_awarded = (SELECT m.tokens FROM public.missions m WHERE m.id = mission_id AND m.active = true)
  );

-- 3. Explicit restrictive block: only admins can read signup_attempts
CREATE POLICY "Block non-admin reads on signup_attempts"
  ON public.signup_attempts
  AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Revoke EXECUTE on has_role from public/authenticated; only used internally by RLS (SECURITY DEFINER bypasses grant for policy use)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
