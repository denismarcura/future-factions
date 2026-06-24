
-- 1) Avatars: require first folder = user id
DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
CREATE POLICY "Authenticated upload avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2) Corp-challenges: require first folder = user id
DROP POLICY IF EXISTS "Authenticated upload corp-challenges" ON storage.objects;
CREATE POLICY "Authenticated upload corp-challenges" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'corp-challenges'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) challenge_winners: restrict public read
DROP POLICY IF EXISTS "Anyone can view winners" ON public.challenge_winners;
CREATE POLICY "Owners read own winner rows" ON public.challenge_winners
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 4) email_notifications: admins only (drop user read)
DROP POLICY IF EXISTS "Users read own notifications" ON public.email_notifications;

-- 5) top100_snapshots: drop public read (server functions use service role)
DROP POLICY IF EXISTS "top100 public read" ON public.top100_snapshots;

-- 6) Fix SECURITY DEFINER functions: set search_path and revoke from anon/public
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
