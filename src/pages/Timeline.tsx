import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Calendar, MapPin, Heart, Users, ArrowRight } from 'lucide-react';
import { MemoryCard } from '../components/Memory/MemoryCard';
import { MemoryCardSkeleton } from '../components/Layout/LoadingSkeleton';
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

  // Landing page for non-authenticated users when no memories exist
  const LandingPage = () => (
    <div className="max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-3xl border border-white/10 p-12 mb-8"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Heart className="h-16 w-16 text-pink-400" fill="currentColor" />
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-purple-500 rounded-full flex items-center justify-center">
              <Users className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
          Share Your Love Story
        </h1>
        
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Create a beautiful timeline of your relationship. Share precious moments, 
          celebrate milestones, and build a digital scrapbook of your love story that 
          you can treasure forever.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Timeline Memories</h3>
            <p className="text-gray-400 text-sm">
              Document your journey from first dates to anniversaries
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <Heart className="h-8 w-8 text-pink-400 mx-auto mb-4" fill="currentColor" />
            <h3 className="text-lg font-semibold text-white mb-2">Share & React</h3>
            <p className="text-gray-400 text-sm">
              React to memories and leave sweet comments for each other
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <MapPin className="h-8 w-8 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Track Places</h3>
            <p className="text-gray-400 text-sm">
              Remember all the special places where memories were made
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Your Story
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
          
          <a
            href="/auth"
            className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
          >
            Sign In
          </a>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-gray-500 text-sm">
          Join thousands of couples sharing their love stories
        </p>
      </motion.div>
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Error loading memories: {error}</p>
      </div>
    );
  }

  // Show landing page for non-authenticated users when no memories exist
  if (!user && !loading && memories.length === 0) {
    return <LandingPage />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
        >
          Our Love Story
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-300"
        >
          A timeline of our beautiful moments together
        </motion.p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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

      {/* Timeline */}
      <div className="space-y-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <MemoryCardSkeleton key={index} />
          ))
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No memories found for the selected filters.</p>
            {user && (
              <p className="text-gray-500 mt-2">
                Be the first to add a memory to your timeline!
              </p>
            )}
          </div>
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
                onComment={addComment}
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