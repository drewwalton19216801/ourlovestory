/*
  # Update memories queries to include participants

  1. Functions
    - Helper functions to get memory participants
    - Update memory stats to include relationship data

  2. Views
    - Create view for memories with all related data
*/

-- Function to get participants for a memory
CREATE OR REPLACE FUNCTION get_memory_participants(memory_id uuid)
RETURNS jsonb AS $$
DECLARE
  participants jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', mp.id,
      'user_id', mp.user_id,
      'user_name', mp.user_name,
      'created_at', mp.created_at
    )
  )
  INTO participants
  FROM memory_participants mp
  WHERE mp.memory_id = get_memory_participants.memory_id;
  
  RETURN COALESCE(participants, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's relationships
CREATE OR REPLACE FUNCTION get_user_relationships(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  relationships jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'partner_id', CASE 
        WHEN r.requester_id = user_id THEN r.receiver_id 
        ELSE r.requester_id 
      END,
      'partner_name', COALESCE(up.display_name, 'Anonymous'),
      'relationship_type', r.relationship_type,
      'is_primary', r.is_primary,
      'status', r.status,
      'created_at', r.created_at
    )
  )
  INTO relationships
  FROM relationships r
  LEFT JOIN user_profiles up ON (
    CASE 
      WHEN r.requester_id = user_id THEN r.receiver_id 
      ELSE r.requester_id 
    END = up.id
  )
  WHERE (r.requester_id = user_id OR r.receiver_id = user_id)
    AND r.status = 'accepted';
  
  RETURN COALESCE(relationships, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for complete memory data
CREATE OR REPLACE VIEW memories_with_relations AS
SELECT 
  m.*,
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'user_id', r.user_id,
        'user_name', r.user_name,
        'reaction_type', r.reaction_type,
        'created_at', r.created_at
      )
    ) FROM reactions r WHERE r.memory_id = m.id),
    '[]'::jsonb
  ) as reactions,
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'user_id', c.user_id,
        'user_name', c.user_name,
        'content', c.content,
        'created_at', c.created_at
      )
    ) FROM comments c WHERE c.memory_id = m.id ORDER BY c.created_at),
    '[]'::jsonb
  ) as comments,
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', mp.id,
        'user_id', mp.user_id,
        'user_name', mp.user_name,
        'created_at', mp.created_at
      )
    ) FROM memory_participants mp WHERE mp.memory_id = m.id),
    '[]'::jsonb
  ) as participants
FROM memories m;