DROP POLICY IF EXISTS "Users create own claims" ON public.mission_claims;

CREATE POLICY "Users create own claims" ON public.mission_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND tokens_awarded >= 0
    AND tokens_awarded <= (
      SELECT COALESCE(m.tokens, 0) + COALESCE(m.bonus_tokens, 0) + 200
      FROM public.missions m
      WHERE m.id = mission_claims.mission_id AND m.active = true
    )
  );