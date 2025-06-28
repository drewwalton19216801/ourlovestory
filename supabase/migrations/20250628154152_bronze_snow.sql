/*
  # Fix user profile creation on signup

  1. Functions
    - Drop and recreate `create_user_profile_if_missing` function
    - Drop and recreate `handle_new_user` trigger function
  
  2. Triggers
    - Drop and recreate trigger on auth.users for automatic profile creation
    
  3. Notes
    - Uses CASCADE to handle dependencies properly
    - Ensures proper order of operations to avoid conflicts
*/

-- Drop existing trigger first to remove dependencies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_user_profile_if_missing(uuid, text) CASCADE;

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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();