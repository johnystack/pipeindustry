-- Create storage bucket for payment proof images
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  false,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update own payment proofs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() = owner
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own payment proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() = owner
);
