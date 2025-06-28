/*
  # Create user profile function and trigger

  1. New Functions
    - `create_user_profile_if_missing` - Creates a user profile for new users
  
  2. New Triggers
    - `on_auth_user_created` - Automatically creates profile when user signs up
  
  3. Security
    - Function runs with SECURITY DEFINER to access auth schema
  
  This resolves the signup error by ensuring user profiles are automatically 
  created when new users register with Supabase Auth.
*/

-- Create the function to create user profiles for new users
CREATE OR REPLACE FUNCTION public.create_user_profile_if_missing(user_id uuid, user_display_name character varying)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (user_id, user_display_name)
  ON CONFLICT (id) DO NOTHING; -- Prevents error if profile already exists
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table to automatically create profiles
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile_if_missing(NEW.id, NEW.email);