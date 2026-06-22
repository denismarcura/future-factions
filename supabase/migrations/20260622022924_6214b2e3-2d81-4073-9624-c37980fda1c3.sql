
CREATE POLICY "Public read corp-challenges"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'corp-challenges');

CREATE POLICY "Authenticated upload corp-challenges"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'corp-challenges');

CREATE POLICY "Owner update corp-challenges"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'corp-challenges' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'corp-challenges' AND owner = auth.uid());

CREATE POLICY "Owner delete corp-challenges"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'corp-challenges' AND owner = auth.uid());
