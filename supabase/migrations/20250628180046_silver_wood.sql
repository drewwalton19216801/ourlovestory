/*
  # Update authentication settings for custom email verification

  1. Configuration
    - This migration documents the manual settings that need to be configured in Supabase Dashboard
    - These settings cannot be set via SQL migration

  2. Required Manual Configuration in Supabase Dashboard:
    - Authentication → Settings → Email Confirmation: Set to OFF
    - Authentication → Settings → Email Change Confirmation: Set to OFF (optional)
    - Add RESEND_API_KEY to Environment Variables in Edge Functions settings
    - Set SITE_URL environment variable for proper redirects

  3. Edge Functions
    - send-email-resend: Handles all outgoing emails via Resend API
    - confirm-email: Handles email verification confirmation
    - find-user: Finds users by email for relationship requests
*/

-- This migration serves as documentation for the required manual configuration
-- The actual settings must be configured in the Supabase Dashboard

-- Add a function to update user email confirmation status
-- This is used by the confirm-email edge function
CREATE OR REPLACE FUNCTION update_user_email_confirmation(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Update the user's email confirmation status
  UPDATE auth.users 
  SET 
    email_confirmed_at = now(),
    updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION update_user_email_confirmation(uuid) TO service_role;