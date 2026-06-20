-- 1. user_roles: block self-assignment. Only admins can INSERT/UPDATE/DELETE.
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. missions: only show active missions to the public.
DROP POLICY IF EXISTS "Anyone can view active missions" ON public.missions;
CREATE POLICY "Anyone can view active missions" ON public.missions
  FOR SELECT TO public
  USING (active = true);

-- Admins can still see all missions through the existing "Admins manage missions" ALL policy.

-- 3. signup_attempts: explicit anonymous block (defense in depth).
CREATE POLICY "Block anon reads on signup_attempts" ON public.signup_attempts
  AS RESTRICTIVE FOR SELECT TO anon
  USING (false);

-- 4. profiles: explicit admin SELECT policy so admins can read profiles through RLS.
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));