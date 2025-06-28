/*
  # Storage bucket and RLS policies for memory images

  1. Storage Bucket
    - Create `memory-images` bucket with appropriate settings
    - 5MB file size limit
    - Allow image formats only

  2. RLS Policies
    - Allow authenticated users to upload images to their own folder
    - Allow public read access to all memory images
    - Allow users to update/delete their own images only
    
  Note: RLS is already enabled on storage.objects by default in Supabase
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

-- Policy: Allow authenticated users to upload images to memory-images bucket
CREATE POLICY "Authenticated users can upload memory images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'memory-images' AND
    -- The first folder in the path must be the user's ID for this policy to work
    (storage.foldername(name))[1] = auth.uid()::text
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
    -- The first folder in the path must be the user's ID for this policy to work
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow users to delete their own memory images
CREATE POLICY "Users can delete their own memory images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'memory-images' AND
    -- The first folder in the path must be the user's ID for this policy to work
    (storage.foldername(name))[1] = auth.uid()::text
  );