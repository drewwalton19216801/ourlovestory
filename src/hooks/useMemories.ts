import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Memory } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { deleteImages, extractStoragePath } from '../lib/storage';

export function useMemories(publicOnly = false) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('memories')
        .select(`
          *,
          reactions(*),
          comments(*),
          participants:memory_participants(*)
        `)
        .order('created_at', { ascending: false });

      if (publicOnly) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        // Handle the case where foreign key relationships don't exist yet
        if (error.code === 'PGRST200' && error.message.includes('relationship')) {
          // Fall back to a simpler query without joins
          const { data: simpleData, error: simpleError } = await supabase
            .from('memories')
            .select('*')
            .order('created_at', { ascending: false });

          if (simpleError) throw simpleError;

          // Add empty arrays for reactions and comments
          const memoriesWithEmptyRelations = (simpleData || []).map(memory => ({
            ...memory,
            reactions: [],
            comments: [],
            participants: []
          }));

          setMemories(memoriesWithEmptyRelations);
          return;
        }
        throw error;
      }

      setMemories(data || []);
    } catch (err) {
      console.error('Error fetching memories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch memories');
    } finally {
      setLoading(false);
    }
  };

  const addMemory = async (memory: Omit<Memory, 'id' | 'created_at' | 'updated_at' | 'reactions' | 'comments'>) => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .insert([memory])
        .select(`
          *,
          reactions(*),
          comments(*),
          participants:memory_participants(*)
        `)
        .single();

      if (error) {
        // Handle foreign key relationship errors during insert
        if (error.code === 'PGRST200' && error.message.includes('relationship')) {
          const { data: simpleData, error: simpleError } = await supabase
            .from('memories')
            .insert([memory])
            .select('*')
            .single();

          if (simpleError) throw simpleError;

          const memoryWithEmptyRelations = {
            ...simpleData,
            reactions: [],
            comments: [],
            participants: []
          };

          setMemories(prev => [memoryWithEmptyRelations, ...prev]);
          return memoryWithEmptyRelations;
        }
        throw error;
      }

      setMemories(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add memory');
    }
  };

  const deleteMemory = async (memoryId: string) => {
    try {
      // First, get the memory to extract image paths for deletion
      const memory = memories.find(m => m.id === memoryId);
      
      // Delete the memory from database (this will cascade delete reactions, comments, etc.)
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;

      // Delete associated images from storage
      if (memory?.images && memory.images.length > 0) {
        try {
          const imagePaths = memory.images
            .map(url => extractStoragePath(url))
            .filter(path => path !== null) as string[];
          
          if (imagePaths.length > 0) {
            await deleteImages(imagePaths);
          }
        } catch (imageError) {
          console.warn('Failed to delete some images from storage:', imageError);
          // Don't throw here as the memory was already deleted from the database
        }
      }

      setMemories(prev => prev.filter(memory => memory.id !== memoryId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete memory');
    }
  };

  // Helper function to get user display name
  const getUserDisplayName = async (userId: string): Promise<string> => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      
      return profile?.display_name || 'Anonymous';
    } catch {
      return 'Anonymous';
    }
  };

  const addReaction = async (memoryId: string, reactionType: 'heart' | 'smile' | 'celebration') => {
    if (!user) return;

    try {
      // Get the user's display name from their profile
      const userName = await getUserDisplayName(user.id);

      const { data, error } = await supabase
        .from('reactions')
        .insert([{
          memory_id: memoryId,
          user_id: user.id,
          reaction_type: reactionType,
          user_name: userName
        }])
        .select()
        .single();

      if (error) throw error;

      setMemories(prev => prev.map(memory => 
        memory.id === memoryId 
          ? { ...memory, reactions: [...(memory.reactions || []), data] }
          : memory
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add reaction');
    }
  };

  const removeReaction = async (memoryId: string, reactionType: 'heart' | 'smile' | 'celebration') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('memory_id', memoryId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);

      if (error) throw error;

      setMemories(prev => prev.map(memory => 
        memory.id === memoryId 
          ? { 
              ...memory, 
              reactions: (memory.reactions || []).filter(r => 
                !(r.user_id === user.id && r.reaction_type === reactionType)
              )
            }
          : memory
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove reaction');
    }
  };

  const toggleReaction = async (memoryId: string, reactionType: 'heart' | 'smile' | 'celebration') => {
    if (!user) return;

    const memory = memories.find(m => m.id === memoryId);
    const hasReacted = memory?.reactions?.some(r => r.user_id === user.id && r.reaction_type === reactionType);

    if (hasReacted) {
      await removeReaction(memoryId, reactionType);
    } else {
      await addReaction(memoryId, reactionType);
    }
  };

  const addComment = async (memoryId: string, content: string) => {
    if (!user) return;

    try {
      // Get the user's display name from their profile
      const userName = await getUserDisplayName(user.id);

      const { data, error } = await supabase
        .from('comments')
        .insert([{
          memory_id: memoryId,
          user_id: user.id,
          content,
          user_name: userName
        }])
        .select()
        .single();

      if (error) throw error;

      setMemories(prev => prev.map(memory => 
        memory.id === memoryId 
          ? { ...memory, comments: [...(memory.comments || []), data] }
          : memory
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  const deleteComment = async (memoryId: string, commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setMemories(prev => prev.map(memory => 
        memory.id === memoryId 
          ? { 
              ...memory, 
              comments: (memory.comments || []).filter(c => c.id !== commentId)
            }
          : memory
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [publicOnly, user]);

  return {
    memories,
    loading,
    error,
    addMemory,
    deleteMemory,
    addReaction,
    removeReaction,
    toggleReaction,
    addComment,
    deleteComment,
    refetch: fetchMemories,
  };
}