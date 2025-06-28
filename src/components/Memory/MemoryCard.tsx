import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Smile, Sparkles, MapPin, Calendar, MessageCircle, Lock, Globe, Users, Trash2, MoreVertical, Clock, Link, ExternalLink, X, Edit3 } from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Memory } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmationModal } from '../UI/ConfirmationModal';
import { AuthPromptModal } from '../UI/AuthPromptModal';
import { format } from 'date-fns';
import { CommentSection } from './CommentSection';
import toast from 'react-hot-toast';

interface MemoryCardProps {
  memory: Memory;
  onReaction: (memoryId: string, reactionType: 'heart' | 'smile' | 'celebration') => void;
  onComment: (memoryId: string, content: string) => void;
  onDeleteMemory: (memoryId: string) => void;
  onDeleteComment: (memoryId: string, commentId: string) => void;
  showViewPostLink?: boolean;
}

const categoryLabels = {
  first_date: 'First Date',
  anniversary: 'Anniversary',
  proposal: 'Proposal',
  wedding: 'Wedding',
  vacation: 'Vacation',
  milestone: 'Milestone',
  special_moment: 'Special Moment',
  everyday_joy: 'Everyday Joy',
};

const categoryColors = {
  first_date: 'bg-pink-500/20 text-pink-300',
  anniversary: 'bg-red-500/20 text-red-300',
  proposal: 'bg-purple-500/20 text-purple-300',
  wedding: 'bg-yellow-500/20 text-yellow-300',
  vacation: 'bg-blue-500/20 text-blue-300',
  milestone: 'bg-green-500/20 text-green-300',
  special_moment: 'bg-indigo-500/20 text-indigo-300',
  everyday_joy: 'bg-orange-500/20 text-orange-300',
};

export function MemoryCard({ 
  memory, 
  onReaction, 
  onComment, 
  onDeleteMemory, 
  onDeleteComment,
  showViewPostLink = true 
}: MemoryCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authPromptAction, setAuthPromptAction] = useState<'react' | 'comment' | 'interact'>('interact');

  const reactionCounts = {
    heart: memory.reactions?.filter(r => r.reaction_type === 'heart').length || 0,
    smile: memory.reactions?.filter(r => r.reaction_type === 'smile').length || 0,
    celebration: memory.reactions?.filter(r => r.reaction_type === 'celebration').length || 0,
  };

  const hasUserReacted = (type: string) => {
    if (!user) return false;
    return memory.reactions?.some(r => r.user_id === user.id && r.reaction_type === type) || false;
  };

  const handleReaction = (type: 'heart' | 'smile' | 'celebration') => {
    if (!user) {
      setAuthPromptAction('react');
      setAuthPromptOpen(true);
      return;
    }
    onReaction(memory.id, type);
  };

  const handleCommentsToggle = () => {
    if (!user) {
      setAuthPromptAction('comment');
      setAuthPromptOpen(true);
      return;
    }
    setShowComments(!showComments);
  };

  const canEditMemory = user && user.id === memory.author_id;
  const canDeleteMemory = user && user.id === memory.author_id;

  const handleEditClick = () => {
    navigate(`/edit-memory/${memory.id}`);
    setShowActions(false);
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    setShowActions(false);
  };

  const handleCopyLink = async () => {
    const memoryUrl = `${window.location.origin}/memory/${memory.id}`;
    
    try {
      await navigator.clipboard.writeText(memoryUrl);
      toast.success('Memory link copied to clipboard!');
      setShowActions(false);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = memoryUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Memory link copied to clipboard!');
      } catch (fallbackErr) {
        toast.error('Failed to copy link');
      }
      document.body.removeChild(textArea);
      setShowActions(false);
    }
  };

  const handleViewPost = () => {
    window.open(`/memory/${memory.id}`, '_blank');
    setShowActions(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteMemory(memory.id);
      toast.success('Memory deleted successfully');
      setDeleteModalOpen(false);
    } catch (error) {
      toast.error('Failed to delete memory');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
  };

  const handleCommentDelete = (commentId: string) => {
    onDeleteComment(memory.id, commentId);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden relative"
      >
        <div className="p-4 sm:p-6">
          {/* Header - Mobile-optimized layout */}
          <div className="flex flex-col space-y-3 mb-4">
            {/* Top Row: Category and Privacy */}
            <div className="flex items-center justify-between">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${categoryColors[memory.category as keyof typeof categoryColors]}`}>
                {categoryLabels[memory.category as keyof typeof categoryLabels]}
              </span>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center text-gray-400">
                  {memory.is_public ? (
                    <Globe className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                
                {/* Actions Menu */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showActions && (
                      <>
                        {/* Backdrop for click outside */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowActions(false)}
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-full mt-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl z-50 min-w-[200px] overflow-hidden"
                        >
                          <motion.button
                            whileHover={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
                            onClick={handleCopyLink}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-left text-purple-400 hover:text-purple-300 transition-all"
                          >
                            <Link className="h-4 w-4" />
                            <span className="font-medium">Copy Post Link</span>
                          </motion.button>

                          {showViewPostLink && (
                            <motion.button
                              whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                              onClick={handleViewPost}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-left text-blue-400 hover:text-blue-300 transition-all"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="font-medium">View Full Post</span>
                            </motion.button>
                          )}

                          {canEditMemory && (
                            <motion.button
                              whileHover={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                              onClick={handleEditClick}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-left text-green-400 hover:text-green-300 transition-all"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span className="font-medium">Edit Memory</span>
                            </motion.button>
                          )}

                          {canDeleteMemory && (
                            <>
                              <div className="border-t border-white/10 my-1"></div>
                              <motion.button
                                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                onClick={handleDeleteClick}
                                className="flex items-center space-x-3 w-full px-4 py-3 text-left text-red-400 hover:text-red-300 transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="font-medium">Delete Memory</span>
                              </motion.button>
                            </>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            
            {/* Date/Time/Location Row - Mobile-friendly stacked layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{format(new Date(memory.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{format(new Date(memory.created_at), 'HH:mm')}</span>
                </div>
                {memory.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{memory.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">{memory.title}</h2>

          {/* Description */}
          <p className="text-gray-300 mb-6 leading-relaxed text-sm sm:text-base">{memory.description}</p>

          {/* Participants */}
          {memory.participants && memory.participants.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-400 flex-shrink-0" />
                <span className="text-sm text-gray-400">With:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {memory.participants.map((participant) => (
                  <span
                    key={participant.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300"
                  >
                    {participant.user_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {memory.images && memory.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {memory.images.map((image, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt={`Memory ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Author - Mobile-optimized layout with clickable author name */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400 mb-4 gap-2">
            <span className="truncate">
              By{' '}
              <RouterLink
                to={`/profile/${memory.author_id}`}
                className="text-purple-300 hover:text-purple-200 hover:underline transition-colors cursor-pointer font-medium"
              >
                {memory.author_name}
              </RouterLink>
            </span>
            <span className="text-xs sm:text-sm">Posted {format(new Date(memory.created_at), 'MMM d, yyyy \'at\' HH:mm')}</span>
          </div>

          {/* Reactions - Mobile-optimized layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-white/10 gap-4">
            <div className="flex items-center justify-center sm:justify-start space-x-2 overflow-x-auto">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReaction('heart')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-colors flex-shrink-0 ${
                  hasUserReacted('heart')
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/10 text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span className="text-sm">{reactionCounts.heart}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReaction('smile')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-colors flex-shrink-0 ${
                  hasUserReacted('smile')
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-white/10 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400'
                }`}
              >
                <Smile className="h-4 w-4" />
                <span className="text-sm">{reactionCounts.smile}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReaction('celebration')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-colors flex-shrink-0 ${
                  hasUserReacted('celebration')
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-white/10 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">{reactionCounts.celebration}</span>
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCommentsToggle}
              className="flex items-center justify-center space-x-1 px-3 py-2 rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-colors flex-shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{memory.comments?.length || 0}</span>
            </motion.button>
          </div>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <CommentSection
              comments={memory.comments || []}
              currentUser={user}
              onAddComment={(content) => onComment(memory.id, content)}
              onDeleteComment={handleCommentDelete}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={closeImageModal}
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-60 w-12 h-12 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center border border-white/20 hover:bg-black/70 transition-all shadow-lg"
              aria-label="Close image"
            >
              <X className="h-6 w-6" />
            </motion.button>

            {/* Image */}
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedImage}
              alt="Memory"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authentication Prompt Modal */}
      <AuthPromptModal
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        action={authPromptAction}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Memory"
        message="Are you sure you want to delete this memory? This action cannot be undone and will also remove all associated comments and reactions."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
}