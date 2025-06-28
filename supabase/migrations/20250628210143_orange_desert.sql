/*
  # Sync display name changes with memory author names

  1. Functions
    - `update_memory_author_names()` - Updates author_name in memories, reactions, comments, and participants
    - `sync_memory_author_names()` - Trigger function to detect display name changes

  2. Triggers
    - `sync_memory_author_names_on_profile_update` - Automatically syncs when display name changes

  3. Backfill
    - Updates all existing records with current display names

  This ensures that when users change their display names, all their previous 
  memories and interactions are updated to reflect the new name.
*/

-- Function to update author names in memories when display name changes
CREATE OR REPLACE FUNCTION update_memory_author_names(target_user_id uuid, new_display_name text)
RETURNS void AS $$
BEGIN
  -- Update author_name in all memories for this user
  UPDATE memories 
  SET 
    author_name = new_display_name,
    updated_at = now()
  WHERE author_id = target_user_id;
  
  -- Also update user_name in reactions for this user
  UPDATE reactions 
  SET user_name = new_display_name
  WHERE user_id = target_user_id;
  
  -- Also update user_name in comments for this user
  UPDATE comments 
  SET user_name = new_display_name
  WHERE user_id = target_user_id;
  
  -- Also update user_name in memory_participants for this user
  UPDATE memory_participants 
  SET user_name = new_display_name
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to handle display name updates
CREATE OR REPLACE FUNCTION sync_memory_author_names()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if display_name actually changed
  IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN
    -- Update all memories and related records for this user
    PERFORM update_memory_author_names(NEW.id, NEW.display_name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync display name changes
DROP TRIGGER IF EXISTS sync_memory_author_names_on_profile_update ON user_profiles;

CREATE TRIGGER sync_memory_author_names_on_profile_update
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_memory_author_names();

-- Backfill: Update any existing memories with current display names
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT up.id, up.display_name
    FROM user_profiles up
    WHERE up.display_name IS NOT NULL
  LOOP
    -- Update memories, reactions, comments, and participants for this user
    PERFORM update_memory_author_names(profile_record.id, profile_record.display_name);
  END LOOP;
END $$;