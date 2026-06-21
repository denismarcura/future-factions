
-- 1. Restrictive policy on profiles to permanently block anon reads
CREATE POLICY "Block anon reads on profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 2. Lock down SECURITY DEFINER functions
-- Trigger-only functions: revoke from everyone (triggers run as table owner)
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies for authenticated users; keep auth, revoke others
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
