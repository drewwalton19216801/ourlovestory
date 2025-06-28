import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useProfile(targetUserId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Determine which user's profile to fetch
  const userId = targetUserId || user?.id;

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist and it's the current user, create one
        if (error.code === 'PGRST116' && !targetUserId && user) {
          // Extract a reasonable display name from user metadata or email
          let displayName = 'Anonymous';
          
          // Try to get name from user metadata
          if (user.user_metadata?.name && user.user_metadata.name !== user.email) {
            displayName = user.user_metadata.name;
          } else if (user.email) {
            // Extract name from email (before @ symbol) as last resort
            const emailPrefix = user.email.split('@')[0];
            // Only use if it doesn't look like a random string
            if (emailPrefix.length > 2 && !emailPrefix.includes('+')) {
              displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            }
          }

          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([{
              id: user.id,
              display_name: displayName,
              default_post_privacy: true // Default to public posts
            }])
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile || targetUserId) return;

    try {
      // Optimistically update the local state first
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        // Revert on error
        setProfile(profile);
        throw error;
      }

      // Update with the actual returned data
      setProfile(data);
      return data;
    } catch (err) {
      // Revert optimistic update on error
      setProfile(profile);
      throw new Error(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  return {
    profile,
    loading,
    error,
    updateProfile: targetUserId ? undefined : updateProfile, // Only allow updates for own profile
    refetch: fetchProfile,
  };
}