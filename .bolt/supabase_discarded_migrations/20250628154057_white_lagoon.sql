/*
  # Fix missing user profile creation function

  This migration creates the necessary function and trigger to automatically
  create user profiles when new users sign up.

  1. Function Changes
    - Drop existing create_user_profile_if_missing function if it exists
    - Create new create_user_profile_if_missing function with correct parameters
    - Create handle_new_user trigger function

  2. Trigger Setup
    - Create trigger on auth.users to automatically create profiles on signup
*/

-- Drop existing function if it exists (with any parameter signature)
DROP FUNCTION IF EXISTS create_user_profile_if_missing(uuid, text);

-- Create the function that Supabase expects to call
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

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table to automatically create profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();