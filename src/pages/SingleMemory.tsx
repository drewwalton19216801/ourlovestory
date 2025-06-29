import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, AlertCircle } from 'lucide-react';
import { MemoryCard } from '../components/Memory/MemoryCard';
import { useSingleMemory } from '../hooks/useMemories';
import { useAuth } from '../contexts/AuthContext';
import { updateMemoryMetaTags, resetMetaTags } from '../lib/metaTags';

export function SingleMemory() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { memory, loading, error, toggleReaction, addComment, deleteComment } = useSingleMemory(id);

  // Update meta tags when memory loads
  useEffect(() => {
    if (memory) {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        updateMemoryMetaTags(memory);
        
        // Log for debugging
        console.log('Meta tags updated for memory:', memory.title);
        console.log('og:description:', document.querySelector('meta[property="og:description"]')?.getAttribute('content'));
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [memory]);

  // Cleanup function to reset meta tags when component unmounts
  useEffect(() => {
    return () => {
      resetMetaTags();
    };
  }, []);

  // Handle missing ID parameter
  if (!id) {
    return <Navigate to="/" replace />;
  }

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
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center"
        >
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Memory Not Found</h1>
          <p className="text-gray-400 mb-6">
            The memory you're looking for doesn't exist or may have been deleted.
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

  // Memory not found (null but no error)
  if (!memory) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center"
        >
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Memory Not Found</h1>
          <p className="text-gray-400 mb-6">
            This memory may be private or no longer exists.
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

  // Privacy check for non-authenticated users
  if (!user && !memory.is_public) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center"
        >
          <Heart className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Private Memory</h1>
          <p className="text-gray-400 mb-6">
            This memory is private. Please sign in to view it if you have access.
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

  // Handle delete (redirect to timeline after successful delete)
  const handleDeleteMemory = async (memoryId: string) => {
    // In the context of a single memory view, we'll need to navigate away after deletion
    // This would be handled by the parent component or through a different approach
    console.log('Delete memory:', memoryId);
  };

  const handleDeleteComment = async (memoryId: string, commentId: string) => {
    await deleteComment(commentId);
  };

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

      {/* Single Memory Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MemoryCard
          memory={memory}
          onReaction={toggleReaction}
          onComment={addComment} // Now directly passes the function with correct signature
          onDeleteMemory={handleDeleteMemory}
          onDeleteComment={handleDeleteComment}
          showViewPostLink={false}
        />
      </motion.div>

      {/* Share Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Heart className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-purple-300 font-medium mb-1">Share This Memory</p>
              <p className="text-purple-200/80">
                This memory has its own dedicated page that you can share on social media. Use the "Copy Post Link" option to get a direct link to this memory.
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info (only show in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 mt-4">
            <summary className="text-gray-300 font-medium mb-2 cursor-pointer">Debug: Current Meta Tags</summary>
            <div className="text-xs font-mono text-gray-400 space-y-1">
              <div>Title: {document.title}</div>
              <div>og:title: {document.querySelector('meta[property="og:title"]')?.getAttribute('content') || 'Not set'}</div>
              <div>og:description: {document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 'Not set'}</div>
              <div>og:image: {document.querySelector('meta[property="og:image"]')?.getAttribute('content') || 'Not set'}</div>
              <div>og:url: {document.querySelector('meta[property="og:url"]')?.getAttribute('content') || 'Not set'}</div>
            </div>
          </details>
        )}
      </motion.div>
    </div>
  );
}