import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Search, UserPlus, Loader2 } from 'lucide-react';
import { useUserSearch, SearchableUser } from '../../hooks/useUserSearch';
import { SelectedUser, Relationship } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

interface UserMultiSelectProps {
  selectedUsers: SelectedUser[];
  onUsersChange: (users: SelectedUser[]) => void;
  relationships: Relationship[];
  disabled?: boolean;
  placeholder?: string;
}

export function UserMultiSelect({ 
  selectedUsers, 
  onUsersChange, 
  relationships,
  disabled = false,
  placeholder = "Search for partners to tag..."
}: UserMultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { searchResults, isSearching, searchError, searchUsers, clearSearch } = useUserSearch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchUsers(debouncedSearchQuery);
      setIsOpen(true);
    } else {
      clearSearch();
      setIsOpen(false);
    }
  }, [debouncedSearchQuery, searchUsers, clearSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserSelect = (user: SearchableUser) => {
    const isAlreadySelected = selectedUsers.some(selected => selected.id === user.id);
    
    if (isAlreadySelected) {
      // Remove user if already selected
      onUsersChange(selectedUsers.filter(selected => selected.id !== user.id));
    } else {
      // Add user to selection
      onUsersChange([...selectedUsers, {
        id: user.id,
        display_name: user.display_name
      }]);
    }
    
    // Clear search and close dropdown
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveUser = (userId: string) => {
    if (disabled) return;
    onUsersChange(selectedUsers.filter(user => user.id !== userId));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setIsOpen(true);
    }
  };

  const isUserSelected = (userId: string) => {
    return selectedUsers.some(selected => selected.id === userId);
  };

  // Get partner IDs from relationships
  const partnerIds = relationships.map(rel => rel.partner_id!);
  
  // Filter search results to only include established relationship partners
  const filteredResults = searchResults.filter(user => 
    !isUserSelected(user.id) && partnerIds.includes(user.id)
  );

  // Check if user has any relationships
  if (relationships.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center space-x-2 text-gray-400 mb-2">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">Tag Partners</span>
        </div>
        <p className="text-sm text-gray-500">
          Connect with partners in your settings to tag them in memories.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">
        <Users className="inline h-4 w-4 mr-1" />
        Tag Partners
      </label>
      
      <div className="space-y-3">
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(user => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2 bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full text-sm border border-purple-500/30"
              >
                <div className="w-5 h-5 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {user.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{user.display_name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.id)}
                    className="hover:text-purple-100 transition-colors p-0.5 rounded-full hover:bg-purple-500/20"
                    aria-label={`Remove ${user.display_name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={placeholder}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {isOpen && (searchQuery.length >= 2) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-2xl z-50 max-h-60 overflow-y-auto"
              >
                {searchError ? (
                  <div className="p-4 text-center text-red-400">
                    <p>{searchError}</p>
                  </div>
                ) : filteredResults.length === 0 && !isSearching ? (
                  <div className="p-4 text-center text-gray-400">
                    <UserPlus className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchQuery.length < 2 
                        ? 'Type at least 2 characters to search' 
                        : partnerIds.length === 0 
                        ? 'No established partnerships found'
                        : 'No partners match your search'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredResults.map(user => {
                      // Find the relationship to get relationship type
                      const relationship = relationships.find(rel => rel.partner_id === user.id);
                      return (
                        <motion.button
                          key={user.id}
                          whileHover={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
                          onClick={() => handleUserSelect(user)}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-purple-500/10 transition-colors"
                        >
                          <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-purple-300">
                              {user.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{user.display_name}</p>
                            <p className="text-xs text-gray-400 capitalize">
                              {relationship?.relationship_type?.replace('_', ' ') || 'Partner'}
                              {relationship?.is_primary && ' • Primary'}
                            </p>
                          </div>
                          <UserPlus className="h-4 w-4 text-purple-400 flex-shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Help Text */}
        <div className="text-sm text-gray-500">
          <p>Search for your established partners by name to tag them in this memory.</p>
          {selectedUsers.length === 0 && relationships.length > 0 && (
            <p className="mt-1">You can tag {relationships.length} partner{relationships.length > 1 ? 's' : ''} who you have connected with.</p>
          )}
        </div>
      </div>
    </div>
  );
}