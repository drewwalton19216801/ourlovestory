/*
  # Create relationships table for partner connections

  1. New Tables
    - `relationships`
      - `id` (uuid, primary key)
      - `requester_id` (uuid, foreign key to users)
      - `receiver_id` (uuid, foreign key to users) 
      - `status` (text: pending, accepted, declined)
      - `relationship_type` (text: romantic, partnership, friendship)
      - `is_primary` (boolean, for designating primary partner)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `relationships` table
    - Add policies for users to manage their own relationships
    - Allow reading of accepted relationships for connected users

  3. Constraints
    - Prevent self-relationships
    - Ensure unique relationships between two users
    - Valid relationship types and statuses
*/

CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  relationship_type text NOT NULL DEFAULT 'romantic',
  is_primary boolean DEFAULT false,
  CONSTRAINT no_self_relationship CHECK (requester_id != receiver_id)
);

-- Add constraints for valid values
ALTER TABLE relationships 
ADD CONSTRAINT relationships_status_check 
CHECK (status IN ('pending', 'accepted', 'declined'));

ALTER TABLE relationships 
ADD CONSTRAINT relationships_type_check 
CHECK (relationship_type IN ('romantic', 'partnership', 'friendship', 'other'));

-- Unique constraint to prevent duplicate relationships
CREATE UNIQUE INDEX IF NOT EXISTS relationships_unique_users 
ON relationships (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));

-- Enable RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- Users can read relationships where they are involved
CREATE POLICY "Users can read their own relationships"
  ON relationships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Users can create relationship requests
CREATE POLICY "Users can create relationship requests"
  ON relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Users can update relationships where they are the receiver (to accept/decline)
CREATE POLICY "Users can respond to relationship requests"
  ON relationships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = receiver_id OR auth.uid() = requester_id);

-- Users can delete their own relationships
CREATE POLICY "Users can delete their own relationships"
  ON relationships
  FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Add updated_at trigger
CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_relationships_requester ON relationships (requester_id);
CREATE INDEX IF NOT EXISTS idx_relationships_receiver ON relationships (receiver_id);
CREATE INDEX IF NOT EXISTS idx_relationships_status ON relationships (status);