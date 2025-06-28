/*
  # Create user profiles table for extended user information

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `display_name` (text)
      - `bio` (text, optional)
      - `avatar_url` (text, optional)
      - `relationship_status` (text)
      - `is_public_profile` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_profiles` table
    - Public profiles readable by everyone
    - Users can only update their own profiles

  3. Functions
    - Auto-create profile on user signup
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  display_name text,
  bio text,
  avatar_url text,
  relationship_status text DEFAULT 'single',
  is_public_profile boolean DEFAULT true
);

-- Add constraint for valid relationship status
ALTER TABLE user_profiles 
ADD CONSTRAINT profiles_relationship_status_check 
CHECK (relationship_status IN ('single', 'in_relationship', 'married', 'complicated', 'prefer_not_to_say'));

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public profiles are readable by everyone
CREATE POLICY "Public profiles are readable by everyone"
  ON user_profiles
  FOR SELECT
  USING (is_public_profile = true);

-- Authenticated users can read all profiles
CREATE POLICY "Authenticated users can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add updated_at trigger
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();