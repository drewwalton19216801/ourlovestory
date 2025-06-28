/*
  # Create reactions table

  1. New Tables
    - `reactions`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with timezone)
      - `memory_id` (uuid, references memories.id)
      - `user_id` (uuid, references auth.users.id)
      - `reaction_type` (text, required - heart, smile, celebration)
      - `user_name` (text, required)

  2. Security
    - Enable RLS on `reactions` table
    - Add policy for reactions to be readable by everyone if the memory is public
    - Add policy for authenticated users to read all reactions
    - Add policy for authenticated users to insert reactions
    - Add policy for users to delete their own reactions
    
  3. Constraints
    - Unique constraint on (memory_id, user_id, reaction_type) to prevent duplicate reactions
    - Check constraint on reaction_type to ensure valid values
*/

CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  memory_id uuid REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type text NOT NULL,
  user_name text NOT NULL DEFAULT 'Anonymous'
);

-- Add constraints
ALTER TABLE reactions 
ADD CONSTRAINT reactions_type_check 
CHECK (reaction_type IN ('heart', 'smile', 'celebration'));

-- Unique constraint to prevent duplicate reactions from same user
CREATE UNIQUE INDEX IF NOT EXISTS reactions_unique_user_memory_type 
ON reactions (memory_id, user_id, reaction_type);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Policy for reactions on public memories to be readable by everyone
CREATE POLICY "Reactions on public memories are readable by everyone"
  ON reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = reactions.memory_id 
      AND memories.is_public = true
    )
  );

-- Policy for authenticated users to read all reactions
CREATE POLICY "Authenticated users can read all reactions"
  ON reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert reactions
CREATE POLICY "Authenticated users can create reactions"
  ON reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);