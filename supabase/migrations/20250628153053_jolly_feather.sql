/*
  # Create memory participants table for tagging partners

  1. New Tables
    - `memory_participants`
      - `id` (uuid, primary key)
      - `memory_id` (uuid, foreign key to memories)
      - `user_id` (uuid, foreign key to users)
      - `user_name` (text, cached for performance)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `memory_participants` table
    - Add policies based on memory visibility
    - Allow memory authors to tag participants

  3. Constraints
    - Unique participant per memory
    - Valid user references
*/

CREATE TABLE IF NOT EXISTS memory_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  memory_id uuid REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL DEFAULT 'Anonymous'
);

-- Unique constraint to prevent duplicate participants
CREATE UNIQUE INDEX IF NOT EXISTS memory_participants_unique 
ON memory_participants (memory_id, user_id);

-- Enable RLS
ALTER TABLE memory_participants ENABLE ROW LEVEL SECURITY;

-- Participants on public memories are readable by everyone
CREATE POLICY "Participants on public memories are readable by everyone"
  ON memory_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = memory_participants.memory_id 
      AND memories.is_public = true
    )
  );

-- Authenticated users can read all participants
CREATE POLICY "Authenticated users can read all participants"
  ON memory_participants
  FOR SELECT
  TO authenticated
  USING (true);

-- Memory authors can add participants
CREATE POLICY "Memory authors can add participants"
  ON memory_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = memory_participants.memory_id 
      AND memories.author_id = auth.uid()
    )
  );

-- Memory authors can remove participants
CREATE POLICY "Memory authors can remove participants"
  ON memory_participants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memories 
      WHERE memories.id = memory_participants.memory_id 
      AND memories.author_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memory_participants_memory ON memory_participants (memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_participants_user ON memory_participants (user_id);