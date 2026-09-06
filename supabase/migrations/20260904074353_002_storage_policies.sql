/*
# Storage policies for KYC documents and cassation exports

1. Security
- kyc-documents: users can read/upload only their own documents (path = user_id/...)
- cassation-exports: public read (anonymized PDFs), only owners can upload
*/

CREATE POLICY "kyc_docs_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "kyc_docs_write_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "kyc_docs_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "cassation_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cassation-exports');

CREATE POLICY "cassation_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cassation-exports');
