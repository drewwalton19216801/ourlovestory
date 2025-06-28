/*
  # Add user settings functionality

  1. New Fields
    - Add `default_post_privacy` to user_profiles table for default post visibility setting
  
  2. Security
    - Users can only update their own settings
*/

-- Add default post privacy setting to user profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'default_post_privacy'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN default_post_privacy boolean DEFAULT true;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_default_privacy 
ON user_profiles(default_post_privacy);