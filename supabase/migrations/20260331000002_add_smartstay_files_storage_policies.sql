-- Create smartstay-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'smartstay-files',
  'smartstay-files',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects
CREATE POLICY "Public read smartstay-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'smartstay-files');

CREATE POLICY "Authenticated upload smartstay-files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'smartstay-files');

CREATE POLICY "Authenticated delete smartstay-files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'smartstay-files');
