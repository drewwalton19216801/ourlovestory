import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar, Users, ArrowRight, MapPin } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  user: User | null;
  loading: boolean;
}

export function HeroSection({ user, loading }: HeroSectionProps) {
  const navigate = useNavigate();

  const handlePrimaryAction = () => {
    if (user) {
      navigate('/add-memory');
    } else {
      navigate('/auth');
    }
  };

  const handleSecondaryAction = () => {
    if (user) {
      navigate('/settings');
    } else {
      navigate('/auth');
    }
  };

  const getPrimaryButtonText = () => {
    if (user) return 'Add Your First Memory';
    return 'Join Our Community';
  };

  const getSecondaryButtonText = () => {
    if (user) return 'Go to Settings';
    return 'Sign In';
  };

  return (
    <div className="text-center mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-3xl border border-white/10 p-8 sm:p-12 mb-8"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-pink-400" fill="currentColor" />
            <div className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 bg-purple-500 rounded-full flex items-center justify-center">
              <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
          Connect Through Love Stories
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Join a social network where relationships matter. Connect with your partner, 
          family, and friends to share precious memories, celebrate milestones together, 
          and build a community around the moments that define your relationships.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <Users className="h-8 w-8 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Connect & Share</h3>
            <p className="text-gray-400 text-sm">
              Build your network and share memories with partners, family, and close friends
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <Heart className="h-8 w-8 text-pink-400 mx-auto mb-4" fill="currentColor" />
            <h3 className="text-lg font-semibold text-white mb-2">Community Engagement</h3>
            <p className="text-gray-400 text-sm">
              React, comment, and celebrate each other's special moments together
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Shared Timelines</h3>
            <p className="text-gray-400 text-sm">
              Create collaborative timelines with those who matter most to you
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrimaryAction}
            disabled={loading}
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getPrimaryButtonText()}
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSecondaryAction}
            disabled={loading}
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getSecondaryButtonText()}
          </motion.button>
        </div>
        
        {/* Community Stats */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-500 text-sm">
              Join a growing community celebrating love, friendship, and family connections
            </p>
          </motion.div>
        )}
        
        {/* Welcome back message for authenticated users */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-purple-300 text-sm">
              Welcome back! Share a new memory or explore what others have been up to.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}