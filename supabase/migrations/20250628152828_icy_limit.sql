/*
  # Create comments table

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with timezone)
      - `memory_id` (uuid, references memories.id)
      - `user_id` (uuid, references auth.users.id)
      - `content` (text, required)
      - `user_name` (text, required)

  2. Security
    - Enable RLS on `comments` table
    - Add policy for comments on public memories to be readable by everyone
    - Add policy for authenticated users to read all comments
    - Add policy for authenticated users to insert comments
    - Add policy for users to update their own comments
    - Add policy for users to delete their own comments
    
  3. Constraints
    - Content length validation (minimum 1 character, maximum 1000 characters)
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  memory_id uuid REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  user_name text NOT NULL DEFAULT 'Anonymous'
);

-- Add constraints
ALTER TABLE comments 
ADD CONSTRAINT comments_content_length_check 
CHECK (char_length(content) >= 1 AND char_length(content) <= 1000);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy for comments on public memories to be readable by everyone
CREATE POLICY "Comments on public memories are readable by everyone"
  ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = comments.memory_id 
      AND memories.is_public = true
    )
  );

-- Policy for authenticated users to read all comments
CREATE POLICY "Authenticated users can read all comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert comments
CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own comments (within 24 hours)
CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND created_at > now() - interval '24 hours'
  )
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);