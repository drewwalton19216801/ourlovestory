/*
  # Create indexes and performance optimizations

  1. Indexes
    - Index on memories.date for timeline sorting
    - Index on memories.author_id for user's memories
    - Index on memories.category for filtering
    - Index on memories.is_public for public/private filtering
    - Index on reactions.memory_id for memory reactions lookup
    - Index on comments.memory_id for memory comments lookup
    - Composite index on memories (date, is_public) for public timeline
    
  2. Performance Optimizations
    - Enable auto-vacuum for better performance
    - Add helpful database functions for common queries
*/

-- Indexes for memories table
CREATE INDEX IF NOT EXISTS idx_memories_date_desc ON memories (date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_author_id ON memories (author_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories (category);
CREATE INDEX IF NOT EXISTS idx_memories_is_public ON memories (is_public);
CREATE INDEX IF NOT EXISTS idx_memories_public_timeline ON memories (date DESC, is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories (created_at DESC);

-- Indexes for reactions table
CREATE INDEX IF NOT EXISTS idx_reactions_memory_id ON reactions (memory_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions (created_at DESC);

-- Indexes for comments table
CREATE INDEX IF NOT EXISTS idx_comments_memory_id ON comments (memory_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at DESC);

-- Function to get memory count by category for analytics
CREATE OR REPLACE FUNCTION get_memory_stats()
RETURNS TABLE (
  total_memories bigint,
  public_memories bigint,
  private_memories bigint,
  categories jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_memories,
    COUNT(*) FILTER (WHERE is_public = true) as public_memories,
    COUNT(*) FILTER (WHERE is_public = false) as private_memories,
    jsonb_object_agg(category, count) as categories
  FROM (
    SELECT category, COUNT(*) as count
    FROM memories 
    GROUP BY category
  ) category_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;