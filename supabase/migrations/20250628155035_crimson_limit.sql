/*
  # Add foreign key constraints for relationships to user_profiles

  1. New Foreign Keys
    - Add foreign key from `relationships.requester_id` to `user_profiles.id`
    - Add foreign key from `relationships.receiver_id` to `user_profiles.id`
  
  2. Purpose
    - Enable PostgREST to understand the relationship between relationships and user_profiles tables
    - Allow direct joins in Supabase queries without going through the users table
  
  3. Notes
    - This enables the join syntax used in useRelationships.ts
    - Maintains data integrity by ensuring referenced user profiles exist
*/

-- Add foreign key constraint from requester_id to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'relationships_requester_id_user_profiles_fkey'
    AND table_name = 'relationships'
  ) THEN
    ALTER TABLE public.relationships
    ADD CONSTRAINT relationships_requester_id_user_profiles_fkey
    FOREIGN KEY (requester_id) REFERENCES public.user_profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from receiver_id to user_profiles  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'relationships_receiver_id_user_profiles_fkey'
    AND table_name = 'relationships'
  ) THEN
    ALTER TABLE public.relationships
    ADD CONSTRAINT relationships_receiver_id_user_profiles_fkey
    FOREIGN KEY (receiver_id) REFERENCES public.user_profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;