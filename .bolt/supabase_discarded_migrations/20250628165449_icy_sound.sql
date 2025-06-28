/*
  # Storage bucket setup for memory images

  1. Storage Bucket
    - Create `memory-images` bucket for storing user uploaded images
    - Enable public access for image viewing
    - Set appropriate file size and type restrictions

  2. Storage Policies
    - Allow authenticated users to upload images
    - Allow public read access to images
    - Allow users to delete their own uploaded images

  3. Storage Functions
    - Set up RLS policies for secure access
*/

-- Create the storage bucket for memory images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memory-images',
  'memory-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload images to memory-images bucket
CREATE POLICY "Authenticated users can upload memory images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'memory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Allow public read access to memory images
CREATE POLICY "Public read access to memory images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'memory-images');

-- Policy: Allow users to update their own memory images
CREATE POLICY "Users can update their own memory images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'memory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Allow users to delete their own memory images
CREATE POLICY "Users can delete their own memory images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'memory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );