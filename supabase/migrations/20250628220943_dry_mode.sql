/*
  # Fix Relationship Request Security

  This migration fixes a critical security vulnerability where requesters could force-accept their own relationship requests.

  ## Changes Made

  1. **Security Policies**
     - Split UPDATE policies to separate status changes from other updates
     - Only receivers can accept/decline pending requests
     - Both parties can update non-status fields after acceptance
     - Enhanced DELETE policy with granular permissions

  2. **Status Validation**
     - Added trigger function to validate status transitions
     - Prevents changing status of accepted/declined relationships
     - Ensures only valid status transitions occur

  3. **Access Control**
     - Requesters can cancel their own pending requests
     - Both parties can remove accepted relationships
     - Receivers can clean up declined requests
*/

-- Drop the current overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can respond to relationship requests" ON relationships;

-- Create a more restrictive policy for status changes
-- Only the receiver can accept or decline pending requests
CREATE POLICY "Only receivers can accept relationship requests"
  ON relationships
  FOR UPDATE
  TO authenticated
  USING (
    -- Only receiver can update status, and only from pending to accepted/declined
    auth.uid() = receiver_id AND 
    status = 'pending'
  )
  WITH CHECK (
    -- Ensure the receiver is making the change and status is valid
    auth.uid() = receiver_id AND 
    status IN ('accepted', 'declined')
  );

-- Create a separate policy for other field updates (after acceptance)
-- Both parties can update non-status fields once relationship is accepted
CREATE POLICY "Partners can update relationship details"
  ON relationships
  FOR UPDATE
  TO authenticated
  USING (
    -- Both parties can update, but only if relationship is already accepted
    (auth.uid() = requester_id OR auth.uid() = receiver_id) AND 
    status = 'accepted'
  )
  WITH CHECK (
    -- Cannot change status once accepted, can only update other fields
    (auth.uid() = requester_id OR auth.uid() = receiver_id) AND 
    status = 'accepted'
  );

-- Add a function to validate relationship status transitions
CREATE OR REPLACE FUNCTION validate_relationship_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent invalid status transitions
  IF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    RAISE EXCEPTION 'Cannot change status of an accepted relationship';
  END IF;
  
  IF OLD.status = 'declined' AND NEW.status != 'declined' THEN
    RAISE EXCEPTION 'Cannot change status of a declined relationship';
  END IF;
  
  -- Only allow pending -> accepted/declined transitions
  IF OLD.status = 'pending' AND NEW.status NOT IN ('pending', 'accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid status transition from pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce status transition rules
DROP TRIGGER IF EXISTS validate_relationship_status_trigger ON relationships;
CREATE TRIGGER validate_relationship_status_trigger
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION validate_relationship_status_change();

-- Update the DELETE policy to be more specific
-- Allow requester to cancel pending requests, both parties to remove accepted relationships
DROP POLICY IF EXISTS "Users can delete their own relationships" ON relationships;

CREATE POLICY "Users can cancel or remove relationships"
  ON relationships
  FOR DELETE
  TO authenticated
  USING (
    -- Requester can cancel their own pending requests
    (auth.uid() = requester_id AND status = 'pending') OR
    -- Both parties can remove accepted relationships
    ((auth.uid() = requester_id OR auth.uid() = receiver_id) AND status = 'accepted') OR
    -- Receiver can delete declined requests to clean up
    (auth.uid() = receiver_id AND status = 'declined')
  );