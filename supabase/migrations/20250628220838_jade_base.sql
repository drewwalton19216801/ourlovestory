/*
  # Fix Relationship Request Security

  1. Security Fix
    - Only the receiver should be able to accept/decline relationship requests
    - Prevent requesters from force-accepting their own requests
    
  2. Updated Policies
    - Split UPDATE policy into separate policies for status changes vs other updates
    - Only receiver can change status from 'pending' to 'accepted'/'declined'
    - Both parties can update non-critical fields after acceptance
    
  3. Enhanced Security
    - Add constraints to prevent invalid status transitions
    - Ensure proper authorization for all relationship operations
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
    uid() = receiver_id AND 
    status = 'pending'
  )
  WITH CHECK (
    -- Ensure the receiver is making the change and status is valid
    uid() = receiver_id AND 
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
    (uid() = requester_id OR uid() = receiver_id) AND 
    status = 'accepted'
  )
  WITH CHECK (
    -- Cannot change status once accepted, can only update other fields
    (uid() = requester_id OR uid() = receiver_id) AND 
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
    (uid() = requester_id AND status = 'pending') OR
    -- Both parties can remove accepted relationships
    ((uid() = requester_id OR uid() = receiver_id) AND status = 'accepted') OR
    -- Receiver can delete declined requests to clean up
    (uid() = receiver_id AND status = 'declined')
  );