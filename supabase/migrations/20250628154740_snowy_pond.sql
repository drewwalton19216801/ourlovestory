/*
  # Fix user profile creation function and trigger

  1. Functions
    - `create_user_profile_if_missing` - Helper function to create user profiles
    - `handle_new_user` - Trigger function that handles new user creation

  2. Triggers
    - `on_auth_user_created` - Automatically creates user profiles when users sign up
*/

-- Create the helper function to create user profiles
CREATE OR REPLACE FUNCTION public.create_user_profile_if_missing(user_id uuid, user_display_name character varying)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (user_id, user_display_name)
  ON CONFLICT (id) DO NOTHING; -- Prevents error if profile already exists
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Call the helper function to create a user profile
  PERFORM public.create_user_profile_if_missing(NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table to automatically create profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();