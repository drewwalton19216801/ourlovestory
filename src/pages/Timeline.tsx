import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Calendar, MapPin, Heart } from 'lucide-react';
import { MemoryCard } from '../components/Memory/MemoryCard';
import { MemoryCardSkeleton } from '../components/Layout/LoadingSkeleton';
import { HeroSection } from '../components/Marketing/HeroSection';
import { useMemories } from '../hooks/useMemories';
import { useAuth } from '../contexts/AuthContext';
import { MemoryCategory } from '../types';

export function Timeline() {
  const { user } = useAuth();
  const { memories, loading, error, toggleReaction, addComment, deleteMemory, deleteComment } = useMemories(!user);
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Memories' },
    { value: 'first_date', label: 'First Date' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'special_moment', label: 'Special Moment' },
    { value: 'everyday_joy', label: 'Everyday Joy' },
  ];

  const years = ['all', ...Array.from(new Set(memories.map(m => new Date(m.date).getFullYear().toString())))];

  const filteredMemories = memories.filter(memory => {
    const categoryMatch = selectedCategory === 'all' || memory.category === selectedCategory;
    const yearMatch = selectedYear === 'all' || new Date(memory.date).getFullYear().toString() === selectedYear;
    return categoryMatch && yearMatch;
  });

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Error loading memories: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section - only show for non-authenticated users */}
      {!user && <HeroSection user={user} loading={loading} />}

      {/* Header for authenticated users */}
      {user && (
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
          >
            <Heart className="inline-block h-10 w-10 lg:h-12 lg:w-12 text-pink-400 mr-4" fill="currentColor" />
            Your Love Story Timeline
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg lg:text-xl text-gray-300"
          >
            Celebrate your beautiful moments and memories together
          </motion.p>
        </div>
      )}

      {/* Filters - only show if there are memories or user is authenticated */}
      {(memories.length > 0 || user) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: user ? 0.3 : 0.3 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-6 mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="h-5 w-5 text-purple-400" />
            <span className="text-white font-medium">Filter Memories</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as MemoryCategory | 'all')}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value} className="bg-gray-800">
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {years.map(year => (
                  <option key={year} value={year} className="bg-gray-800">
                    {year === 'all' ? 'All Years' : year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="space-y-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <MemoryCardSkeleton key={index} />
          ))
        ) : filteredMemories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-gray-400 text-lg mb-2">
              {memories.length === 0 
                ? "No memories have been shared yet." 
                : "No memories found for the selected filters."
              }
            </p>
            {user && memories.length === 0 && (
              <p className="text-gray-500">
                Be the first to add a memory to the timeline!
              </p>
            )}
            {!user && memories.length === 0 && (
              <p className="text-gray-500">
                Join the community to start sharing and viewing memories.
              </p>
            )}
          </motion.div>
        ) : (
          filteredMemories.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MemoryCard
                memory={memory}
                onReaction={toggleReaction}
                onComment={(content) => addComment(memory.id, content)} // Wrap to match new signature
                onDeleteMemory={deleteMemory}
                onDeleteComment={deleteComment}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}