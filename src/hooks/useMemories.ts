import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Memory } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { deleteImages, extractStoragePath, uploadImages } from '../lib/storage';

export function useMemories(publicOnly = false, authorId?: string) {
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

      // Apply filters based on parameters
      if (publicOnly) {
        query = query.eq('is_public', true);
      }

      if (authorId) {
        query = query.eq('author_id', authorId);
        // If viewing someone else's profile and not authenticated, only show public memories
        if (authorId !== user?.id && !user) {
          query = query.eq('is_public', true);
        }
        // If viewing someone else's profile while authenticated, only show public memories unless it's your own profile
        if (authorId !== user?.id) {
          query = query.eq('is_public', true);
        }
      }

      const { data, error } = await query;

      if (error) {
        // Handle the case where foreign key relationships don't exist yet
        if (error.code === 'PGRST200' && error.message.includes('relationship')) {
          // Fall back to a simpler query without joins
          let simpleQuery = supabase
            .from('memories')
            .select('*')
            .order('created_at', { ascending: false });

          if (publicOnly) {
            simpleQuery = simpleQuery.eq('is_public', true);
          }

          if (authorId) {
            simpleQuery = simpleQuery.eq('author_id', authorId);
            if (authorId !== user?.id && !user) {
              simpleQuery = simpleQuery.eq('is_public', true);
            }
            if (authorId !== user?.id) {
              simpleQuery = simpleQuery.eq('is_public', true);
            }
          }

          const { data: simpleData, error: simpleError } = await simpleQuery;

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

  const fetchMemory = async (memoryId: string): Promise<Memory | null> => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          reactions(*),
          comments(*),
          participants:memory_participants(*)
        `)
        .eq('id', memoryId)
        .single();

      if (error) {
        // Handle the case where foreign key relationships don't exist yet
        if (error.code === 'PGRST200' && error.message.includes('relationship')) {
          const { data: simpleData, error: simpleError } = await supabase
            .from('memories')
            .select('*')
            .eq('id', memoryId)
            .single();

          if (simpleError) throw simpleError;

          return {
            ...simpleData,
            reactions: [],
            comments: [],
            participants: []
          };
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching memory:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch memory');
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

  const updateMemory = async (
    memoryId: string, 
    updates: Partial<Memory>,
    existingImageUrls: string[] = [],
    newlySelectedImageFiles: File[] = []
  ) => {
    try {
      // Find the current memory to get existing images
      const currentMemory = memories.find(m => m.id === memoryId);
      if (!currentMemory) {
        throw new Error('Memory not found');
      }

      // Determine which images to delete
      const currentImageUrls = currentMemory.images || [];
      const imagesToDelete = currentImageUrls.filter(url => !existingImageUrls.includes(url));

      // Delete images that are no longer needed
      if (imagesToDelete.length > 0) {
        try {
          const imagePaths = imagesToDelete
            .map(url => extractStoragePath(url))
            .filter(path => path !== null) as string[];
          
          if (imagePaths.length > 0) {
            await deleteImages(imagePaths);
          }
        } catch (imageError) {
          console.warn('Failed to delete some images from storage:', imageError);
          // Continue with update even if image deletion fails
        }
      }

      // Upload new images
      let newImageUrls: string[] = [];
      if (newlySelectedImageFiles.length > 0) {
        try {
          const uploadResults = await uploadImages(newlySelectedImageFiles, user?.id);
          newImageUrls = uploadResults.map(result => result.url);
        } catch (uploadError) {
          throw new Error('Failed to upload new images. Please try again.');
        }
      }

      // Combine existing and new image URLs
      const finalImageUrls = [...existingImageUrls, ...newImageUrls];

      // Prepare the update object
      const updateData = {
        ...updates,
        images: finalImageUrls,
        updated_at: new Date().toISOString()
      };

      // Update the memory in the database
      const { data, error } = await supabase
        .from('memories')
        .update(updateData)
        .eq('id', memoryId)
        .select(`
          *,
          reactions(*),
          comments(*),
          participants:memory_participants(*)
        `)
        .single();

      if (error) {
        // Handle foreign key relationship errors during update
        if (error.code === 'PGRST200' && error.message.includes('relationship')) {
          const { data: simpleData, error: simpleError } = await supabase
            .from('memories')
            .update(updateData)
            .eq('id', memoryId)
            .select('*')
            .single();

          if (simpleError) throw simpleError;

          const memoryWithRelations = {
            ...simpleData,
            reactions: currentMemory.reactions || [],
            comments: currentMemory.comments || [],
            participants: currentMemory.participants || []
          };

          setMemories(prev => prev.map(memory => 
            memory.id === memoryId ? memoryWithRelations : memory
          ));
          return memoryWithRelations;
        }
        throw error;
      }

      // Update local state
      setMemories(prev => prev.map(memory => 
        memory.id === memoryId ? data : memory
      ));
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update memory');
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
      
      // Return display_name if it exists and is not an email address
      if (profile?.display_name) {
        // Check if display_name looks like an email
        if (profile.display_name.includes('@') && profile.display_name.includes('.')) {
          // Try to extract a better name from email
          const emailPrefix = profile.display_name.split('@')[0];
          if (emailPrefix.length > 2 && !emailPrefix.includes('+')) {
            return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          }
          return 'Anonymous';
        }
        return profile.display_name;
      }
      
      return 'Anonymous';
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

      // DEBUG: Log all the values being prepared for insertion
      console.log('[useMemories.addComment] Preparing to insert comment:', {
        memory_id: memoryId,
        user_id: user.id,
        content: content,
        user_name: userName,
        contentType: typeof content,
        contentLength: content.length,
        userIdType: typeof user.id,
        userNameType: typeof userName,
        timestamp: new Date().toISOString()
      });

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

      if (error) {
        console.error('[useMemories.addComment] Supabase error:', error);
        throw error;
      }

      // DEBUG: Log the returned data from Supabase
      console.log('[useMemories.addComment] Comment inserted successfully:', {
        returnedData: data,
        returnedContent: data?.content,
        returnedContentType: typeof data?.content,
        timestamp: new Date().toISOString()
      });

      setMemories(prev => prev.map(memory => 
        memory.id === memoryId 
          ? { ...memory, comments: [...(memory.comments || []), data] }
          : memory
      ));
    } catch (err) {
      console.error('[useMemories.addComment] Error:', err);
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
  }, [publicOnly, user, authorId]);

  return {
    memories,
    loading,
    error,
    addMemory,
    updateMemory,
    deleteMemory,
    addReaction,
    removeReaction,
    toggleReaction,
    addComment,
    deleteComment,
    fetchMemory,
    refetch: fetchMemories,
  };
}

export function useSingleMemory(memoryId: string | undefined) {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMemory = async () => {
    if (!memoryId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          reactions(*),
          comments(*),
          participants:memory_participants(*)
        `)
        .eq('id', memoryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Memory not found');
          return;
        }
        throw error;
      }

      setMemory(data);
    } catch (err) {
      console.error('Error fetching memory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch memory');
    } finally {
      setLoading(false);
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
      
      // Return display_name if it exists and is not an email address
      if (profile?.display_name) {
        // Check if display_name looks like an email
        if (profile.display_name.includes('@') && profile.display_name.includes('.')) {
          // Try to extract a better name from email
          const emailPrefix = profile.display_name.split('@')[0];
          if (emailPrefix.length > 2 && !emailPrefix.includes('+')) {
            return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          }
          return 'Anonymous';
        }
        return profile.display_name;
      }
      
      return 'Anonymous';
    } catch {
      return 'Anonymous';
    }
  };

  const toggleReaction = async (reactionType: 'heart' | 'smile' | 'celebration') => {
    if (!user || !memory) return;

    const hasReacted = memory.reactions?.some(r => r.user_id === user.id && r.reaction_type === reactionType);

    try {
      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('memory_id', memory.id)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType);

        if (error) throw error;

        setMemory(prev => prev ? { 
          ...prev, 
          reactions: (prev.reactions || []).filter(r => 
            !(r.user_id === user.id && r.reaction_type === reactionType)
          )
        } : null);
      } else {
        // Add reaction
        const userName = await getUserDisplayName(user.id);

        const { data, error } = await supabase
          .from('reactions')
          .insert([{
            memory_id: memory.id,
            user_id: user.id,
            reaction_type: reactionType,
            user_name: userName
          }])
          .select()
          .single();

        if (error) throw error;

        setMemory(prev => prev ? { 
          ...prev, 
          reactions: [...(prev.reactions || []), data] 
        } : null);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to toggle reaction');
    }
  };

  const addComment = async (content: string) => {
    if (!user || !memory) return;

    try {
      const userName = await getUserDisplayName(user.id);

      // DEBUG: Log all the values being prepared for insertion
      console.log('[useSingleMemory.addComment] Preparing to insert comment:', {
        memory_id: memory.id,
        user_id: user.id,
        content: content,
        user_name: userName,
        contentType: typeof content,
        contentLength: content.length,
        userIdType: typeof user.id,
        userNameType: typeof userName,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from('comments')
        .insert([{
          memory_id: memory.id,
          user_id: user.id,
          content,
          user_name: userName
        }])
        .select()
        .single();

      if (error) {
        console.error('[useSingleMemory.addComment] Supabase error:', error);
        throw error;
      }

      // DEBUG: Log the returned data from Supabase
      console.log('[useSingleMemory.addComment] Comment inserted successfully:', {
        returnedData: data,
        returnedContent: data?.content,
        returnedContentType: typeof data?.content,
        timestamp: new Date().toISOString()
      });

      setMemory(prev => prev ? { 
        ...prev, 
        comments: [...(prev.comments || []), data] 
      } : null);
    } catch (err) {
      console.error('[useSingleMemory.addComment] Error:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!memory) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setMemory(prev => prev ? { 
        ...prev, 
        comments: (prev.comments || []).filter(c => c.id !== commentId)
      } : null);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  useEffect(() => {
    fetchMemory();
  }, [memoryId, user]);

  return {
    memory,
    loading,
    error,
    toggleReaction,
    addComment,
    deleteComment,
    refetch: fetchMemory,
  };
}