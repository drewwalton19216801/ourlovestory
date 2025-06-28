import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface SearchableUser {
  id: string;
  display_name: string;
  is_public_profile: boolean;
}

export function useUserSearch() {
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { user } = useAuth();

  const searchUsers = useCallback(async (query: string) => {
    if (!user) {
      setSearchResults([]);
      return;
    }

    // Clear results if query is too short
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const trimmedQuery = query.trim();
      
      // Search for users by display_name or email-like patterns
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, is_public_profile')
        .or(`display_name.ilike.%${trimmedQuery}%`)
        .neq('id', user.id) // Exclude current user
        .limit(10);

      if (error) {
        throw error;
      }

      // Filter out any profiles with UUID-like display names or empty display names
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validProfiles = (profiles || []).filter(profile => 
        profile.display_name && 
        profile.display_name.trim().length > 0 &&
        !uuidPattern.test(profile.display_name)
      );

      setSearchResults(validProfiles);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchError('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    searchUsers,
    clearSearch,
  };
}