
CREATE POLICY "Public can read match-results"
ON storage.objects FOR SELECT
USING (bucket_id = 'match-results');

CREATE POLICY "Admins can upload match-results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'match-results' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update match-results"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'match-results' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete match-results"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'match-results' AND public.has_role(auth.uid(), 'admin'));
