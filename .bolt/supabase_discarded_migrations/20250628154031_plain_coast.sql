/*
  # Add missing create_user_profile_if_missing function

  1. New Functions
    - `create_user_profile_if_missing(user_id uuid, email text)`
      - Creates a user profile if one doesn't exist
      - Used during user signup process
  
  2. Functionality
    - Inserts a new row in user_profiles table for new users
    - Uses email as initial display_name if no profile exists
    - Sets sensible defaults for new profiles
*/

-- Create the missing function that Supabase is trying to call
CREATE OR REPLACE FUNCTION create_user_profile_if_missing(user_id uuid, email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a new profile if one doesn't exist
  INSERT INTO public.user_profiles (
    id,
    display_name,
    bio,
    avatar_url,
    relationship_status,
    is_public_profile
  )
  VALUES (
    user_id,
    email, -- Use email as initial display name
    NULL,
    NULL,
    'single',
    true
  )
  ON CONFLICT (id) DO NOTHING; -- Don't overwrite if profile already exists
END;
$$;

-- Create a trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the function to create a user profile
  PERFORM create_user_profile_if_missing(NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table to automatically create profiles
-- Note: This may already exist, so we use IF NOT EXISTS equivalent
DO $$
BEGIN
  -- Drop trigger if it exists to recreate it
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Create the trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
END $$;