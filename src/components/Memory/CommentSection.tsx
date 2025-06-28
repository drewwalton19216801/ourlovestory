import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Trash2 } from 'lucide-react';
import { Comment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmationModal } from '../UI/ConfirmationModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function CommentSection({ comments, onAddComment, onDeleteComment }: CommentSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="border-t border-white/10 bg-black/10"
      >
        <div className="p-6">
          {/* Comments List */}
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 group">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-300">
                    {comment.user_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-white">{comment.user_name}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(comment.created_at), 'MMM d, yyyy • HH:mm')}
                    </span>
                    {user && user.id === comment.user_id && (
                      <button
                        onClick={() => handleDeleteClick(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all ml-2"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment Form */}
          {user && (
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-purple-300">
                  {(user.user_metadata?.name || user.email || '').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
            </form>
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