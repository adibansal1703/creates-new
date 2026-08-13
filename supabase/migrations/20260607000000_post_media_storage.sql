-- Public media bucket for post images required by Instagram Graph API
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Users upload own post media" ON storage.objects;
CREATE POLICY "Users upload own post media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own post media" ON storage.objects;
CREATE POLICY "Users update own post media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own post media" ON storage.objects;
CREATE POLICY "Users delete own post media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Public read post media" ON storage.objects;
CREATE POLICY "Public read post media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post-media');
