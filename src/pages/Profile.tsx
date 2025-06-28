import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Heart, Calendar, MapPin, AlertCircle, Lock, Globe } from 'lucide-react';
import { MemoryCard } from '../components/Memory/MemoryCard';
import { MemoryCardSkeleton } from '../components/Layout/LoadingSkeleton';
import { useProfile } from '../hooks/useProfile';
import { useMemories } from '../hooks/useMemories';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfile(userId);
  const { memories, loading: memoriesLoading, toggleReaction, addComment, deleteMemory, deleteComment } = useMemories(false, userId);

  // Handle missing ID parameter
  if (!userId) {
    return <Navigate to="/" replace />;
  }

  const isOwnProfile = user?.id === userId;
  const loading = profileLoading || memoriesLoading;

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center"
        >
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">
            The profile you're looking for doesn't exist or may not be accessible.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Timeline</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Profile not found (null but no error)
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center"
        >
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">
            This user's profile may be private or no longer exists.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Timeline</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Privacy check for non-authenticated users viewing private profiles
  if (!user && !profile.is_public_profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center"
        >
          <Lock className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Private Profile</h1>
          <p className="text-gray-400 mb-6">
            This profile is private. Please sign in to view it if you have access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <span>Sign In</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all border border-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Timeline</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const publicMemories = memories.filter(memory => 
    memory.is_public || isOwnProfile
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Timeline</span>
        </Link>
      </motion.div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-6 sm:p-8 mb-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border-2 border-purple-500/30">
              <User className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {profile.display_name || 'Anonymous User'}
                </h1>
                
                {profile.bio && (
                  <p className="text-gray-300 leading-relaxed mb-3">{profile.bio}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {profile.is_public_profile ? (
                      <>
                        <Globe className="h-4 w-4 text-green-400" />
                        <span className="text-green-400">Public Profile</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-gray-400" />
                        <span>Private Profile</span>
                      </>
                    )}
                  </div>

                  {profile.relationship_status && profile.relationship_status !== 'prefer_not_to_say' && (
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-pink-400" />
                      <span className="capitalize">{profile.relationship_status.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Profile Button for own profile */}
              {isOwnProfile && (
                <Link
                  to="/settings"
                  className="flex-shrink-0 px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors border border-purple-500/30 text-sm font-medium"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Memories Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isOwnProfile ? 'Your Memories' : `${profile.display_name || 'Their'} Memories`}
          </h2>
          <div className="text-sm text-gray-400">
            {publicMemories.length} {publicMemories.length === 1 ? 'memory' : 'memories'}
          </div>
        </div>

        {/* Memories List */}
        <div className="space-y-8">
          {memoriesLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <MemoryCardSkeleton key={index} />
            ))
          ) : publicMemories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-black/20 backdrop-blur-md rounded-xl border border-white/10"
            >
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">
                {isOwnProfile 
                  ? "You haven't shared any memories yet." 
                  : `${profile.display_name || 'This user'} hasn't shared any public memories yet.`
                }
              </p>
              {isOwnProfile && (
                <Link
                  to="/add-memory"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all mt-4"
                >
                  <span>Create Your First Memory</span>
                </Link>
              )}
            </motion.div>
          ) : (
            publicMemories.map((memory, index) => (
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
      </motion.div>

      {/* Privacy Notice for non-own profiles */}
      {!isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">Profile View</p>
              <p className="text-blue-200/80">
                You're viewing {profile.display_name || 'this user'}'s profile. 
                Only public memories are shown unless you have special access.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}