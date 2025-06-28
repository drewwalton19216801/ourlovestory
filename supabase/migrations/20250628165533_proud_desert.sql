/*
  # Setup Supabase Storage for Memory Images

  1. Storage Bucket
    - Creates 'memory-images' bucket for storing uploaded images
    - Configured for public read access with 5MB file size limit
    - Restricts to image MIME types only

  2. Security Notes
    - Storage policies are managed through Supabase's built-in storage system
    - RLS on storage.objects is pre-configured by Supabase
    - File access control is handled through bucket configuration
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