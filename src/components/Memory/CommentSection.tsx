import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Trash2, LogIn, UserPlus } from 'lucide-react';
import { Comment } from '../../types';
import { User } from '@supabase/supabase-js';
import { ConfirmationModal } from '../UI/ConfirmationModal';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  comments: Comment[];
  currentUser: User | null;
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function CommentSection({ comments, currentUser, onAddComment, onDeleteComment }: CommentSectionProps) {
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || isSubmitting) return;

    const trimmedComment = newComment.trim();

    // DEBUG: Log comment values before submission
    console.log('🐛 CommentSection.handleSubmit - DEBUG:', {
      newComment,
      trimmedComment,
      newCommentType: typeof newComment,
      trimmedCommentType: typeof trimmedComment,
      newCommentLength: newComment.length,
      trimmedCommentLength: trimmedComment.length,
      currentUserId: currentUser?.id,
      timestamp: new Date().toISOString()
    });

    // Client-side validation: Check if content looks like a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(trimmedComment)) {
      console.error('🐛 CommentSection.handleSubmit - UUID DETECTED as comment content:', trimmedComment);
      toast.error('Comment content cannot be a UUID. Please enter a meaningful comment.');
      return;
    }

    // Additional validation: prevent extremely short meaningless content
    if (trimmedComment.length < 2) {
      toast.error('Comment must be at least 2 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🐛 CommentSection.handleSubmit - About to call onAddComment with:', trimmedComment);
      await onAddComment(trimmedComment);
      setNewComment('');
      console.log('🐛 CommentSection.handleSubmit - Successfully added comment and cleared state');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;

    setIsDeleting(true);
    try {
      await onDeleteComment(commentToDelete);
      toast.success('Comment deleted successfully');
      setDeleteModalOpen(false);
      setCommentToDelete(null);
    } catch (error) {
      toast.error('Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setCommentToDelete(null);
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="border-t border-white/10 bg-black/10"
      >
        <div className="p-4 sm:p-6">
          {/* Comments List */}
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 group">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-300">
                    {comment.user_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">{comment.user_name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {format(new Date(comment.created_at), 'MMM d, yyyy • HH:mm')}
                    </span>
                    {currentUser && currentUser.id === comment.user_id && (
                      <button
                        onClick={() => handleDeleteClick(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all ml-2 flex-shrink-0"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm break-words">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment Form or Sign In Prompt */}
          {currentUser ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              {/* Avatar - Always visible */}
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-purple-300">
                  {(currentUser.user_metadata?.name || currentUser.email || '').charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Input and Button Container */}
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('🐛 CommentSection.onChange - Input value changed:', {
                      oldValue: newComment,
                      newValue,
                      valueType: typeof newValue,
                      timestamp: new Date().toISOString()
                    });
                    setNewComment(newValue);
                  }}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm min-w-0"
                  disabled={isSubmitting}
                  maxLength={1000}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 self-start sm:self-auto"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
            </form>
          ) : (
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="text-center">
                <p className="text-gray-300 mb-4">Sign in to join the conversation</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignIn}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Create Account</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignIn}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all border border-white/20"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
}