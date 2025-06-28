/*
  # Ensure User Profile Creation on Signup

  1. Functions
    - `handle_new_user()` - Creates user profile automatically when new user signs up
    - `create_user_profile_if_missing()` - Helper function to create missing profiles

  2. Triggers
    - `on_auth_user_created` - Automatically creates profile for new users

  3. Backfill
    - Creates profiles for any existing users without profiles

  This ensures every user has a profile record that can be used throughout the application.
*/

-- Function to create user profile if it doesn't exist
CREATE OR REPLACE FUNCTION create_user_profile_if_missing(user_id uuid, user_name text DEFAULT 'Anonymous')
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, relationship_status, is_public_profile)
  VALUES (user_id, user_name, 'single', true)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Extract name from user metadata
  PERFORM create_user_profile_if_missing(
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Anonymous')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill: Create profiles for existing users who don't have them
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  LOOP
    PERFORM create_user_profile_if_missing(
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'name', user_record.email, 'Anonymous')
    );
  END LOOP;
END $$;