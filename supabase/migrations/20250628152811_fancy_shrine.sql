/*
  # Create memories table

  1. New Tables
    - `memories`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)
      - `title` (text, required)
      - `description` (text, required)
      - `date` (date, required)
      - `location` (text, optional)
      - `category` (text, required)
      - `is_public` (boolean, default true)
      - `images` (text array, default empty array)
      - `author_id` (uuid, references auth.users)
      - `author_name` (text, required)

  2. Security
    - Enable RLS on `memories` table
    - Add policy for public memories to be readable by everyone
    - Add policy for authenticated users to read all memories
    - Add policy for authenticated users to insert their own memories
    - Add policy for users to update their own memories
    - Add policy for users to delete their own memories
*/

CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  location text,
  category text NOT NULL DEFAULT 'special_moment',
  is_public boolean DEFAULT true,
  images text[] DEFAULT '{}',
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Anonymous'
);

-- Enable RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Policy for public memories to be readable by everyone
CREATE POLICY "Public memories are readable by everyone"
  ON memories
  FOR SELECT
  USING (is_public = true);

-- Policy for authenticated users to read all memories
CREATE POLICY "Authenticated users can read all memories"
  ON memories
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert their own memories
CREATE POLICY "Users can create their own memories"
  ON memories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Policy for users to update their own memories
CREATE POLICY "Users can update their own memories"
  ON memories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Policy for users to delete their own memories
CREATE POLICY "Users can delete their own memories"
  ON memories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();