import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: 'react' | 'comment' | 'interact';
}

export function AuthPromptModal({ isOpen, onClose, action = 'interact' }: AuthPromptModalProps) {
  const navigate = useNavigate();

  const actionMessages = {
    react: {
      title: 'Sign In to React',
      message: 'Join Our Love Story to react to memories and show your appreciation for special moments.',
    },
    comment: {
      title: 'Sign In to Comment', 
      message: 'Create an account or sign in to leave comments and engage with the community.',
    },
    interact: {
      title: 'Join Our Love Story',
      message: 'Sign in or create an account to interact with memories, leave comments, and share your own love story.',
    },
  };

  const { title, message } = actionMessages[action];

  const handleSignIn = () => {
    navigate('/auth');
    onClose();
  };

  const handleSignUp = () => {
    navigate('/auth');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-black/40 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>

            {/* Content */}
            <div className="pr-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                  <Heart className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed">{message}</p>

              {/* Benefits */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                <h4 className="text-purple-300 font-medium mb-2">What you can do:</h4>
                <ul className="text-purple-200/80 space-y-1 text-sm">
                  <li>• React to memories with hearts and celebrations</li>
                  <li>• Leave comments and engage with the community</li>
                  <li>• Create and share your own love story timeline</li>
                  <li>• Connect with partners and friends</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignUp}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignIn}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/20 transition-all border border-white/20"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </motion.button>
              </div>

              {/* Footer note */}
              <p className="text-center text-xs text-gray-500 mt-4">
                It's free and takes less than a minute to join
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}