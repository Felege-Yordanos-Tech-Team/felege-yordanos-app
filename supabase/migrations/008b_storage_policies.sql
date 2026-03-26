-- Storage RLS policies for the 'receipts' bucket.
-- NOTE: Create the bucket manually in Supabase Dashboard first:
--   Storage > New Bucket > name: "receipts", Public: OFF
--   Allowed MIME types: image/jpeg, image/png, application/pdf
--   Max file size: 5MB (5242880 bytes)

-- INSERT: authenticated users can upload to their own folder
CREATE POLICY "Users can upload own receipts"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: users can read their own receipts
CREATE POLICY "Users can read own receipts"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: admin/super_admin and Budget dept head (dept 9) can read all receipts
CREATE POLICY "Admins can read all receipts"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (
      public.get_my_role() IN ('admin', 'super_admin')
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'dept_head'
          AND department_id = 9
      )
    )
  );
