/*
  # Fix user profile creation and display name handling

  1. Database Triggers
    - Create proper trigger to auto-create user profiles when users sign up
    - Ensure display name is extracted from user metadata correctly

  2. Profile Creation Function
    - Auto-create user profile when user signs up
    - Extract display name from auth.users metadata
    - Set sensible defaults for other profile fields
*/

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  display_name_value TEXT;
BEGIN
  -- Extract display name from user metadata
  display_name_value := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.email IS NOT NULL AND NEW.email != '' THEN
        CASE 
          WHEN position('@' in NEW.email) > 1 THEN
            -- Extract prefix from email and capitalize first letter
            initcap(split_part(NEW.email, '@', 1))
          ELSE 'Anonymous'
        END
      ELSE 'Anonymous'
    END
  );

  -- Ensure the display name is not just an email address
  IF display_name_value ~ '^[^@]+@[^@]+\.[^@]+$' THEN
    -- If it looks like an email, extract the prefix
    display_name_value := initcap(split_part(display_name_value, '@', 1));
  END IF;

  -- Ensure minimum length
  IF length(display_name_value) < 2 THEN
    display_name_value := 'Anonymous';
  END IF;

  -- Insert the user profile
  INSERT INTO user_profiles (
    id,
    display_name,
    relationship_status,
    is_public_profile,
    default_post_privacy,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    display_name_value,
    'single',
    true,
    true,
    now(),
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update existing users who might not have profiles yet
-- This is a one-time operation to fix any existing users
DO $$
DECLARE
  auth_user RECORD;
  display_name_value TEXT;
BEGIN
  -- Loop through auth users who don't have profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
      AND au.email_confirmed_at IS NOT NULL -- Only for verified users
  LOOP
    -- Extract display name from user metadata
    display_name_value := COALESCE(
      auth_user.raw_user_meta_data->>'name',
      auth_user.raw_user_meta_data->>'display_name',
      auth_user.raw_user_meta_data->>'full_name',
      CASE 
        WHEN auth_user.email IS NOT NULL AND auth_user.email != '' THEN
          CASE 
            WHEN position('@' in auth_user.email) > 1 THEN
              -- Extract prefix from email and capitalize first letter
              initcap(split_part(auth_user.email, '@', 1))
            ELSE 'Anonymous'
          END
        ELSE 'Anonymous'
      END
    );

    -- Ensure the display name is not just an email address
    IF display_name_value ~ '^[^@]+@[^@]+\.[^@]+$' THEN
      -- If it looks like an email, extract the prefix
      display_name_value := initcap(split_part(display_name_value, '@', 1));
    END IF;

    -- Ensure minimum length
    IF length(display_name_value) < 2 THEN
      display_name_value := 'Anonymous';
    END IF;

    -- Insert the user profile
    INSERT INTO user_profiles (
      id,
      display_name,
      relationship_status,
      is_public_profile,
      default_post_privacy,
      created_at,
      updated_at
    ) VALUES (
      auth_user.id,
      display_name_value,
      'single',
      true,
      true,
      now(),
      now()
    );
  END LOOP;
END $$;