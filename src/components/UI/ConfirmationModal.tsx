import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false
}: ConfirmationModalProps) {
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
              disabled={isLoading}
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>

            {/* Content */}
            <div className="pr-8">
              <div className="flex items-center space-x-3 mb-4">
                {isDestructive && (
                  <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">{title}</h3>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed">{message}</p>

              {/* Actions */}
              <div className="flex space-x-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-gray-300 hover:bg-white/20 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border ${
                    isDestructive
                      ? 'bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30 hover:text-red-200'
                      : 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30 hover:text-purple-200'
                  }`}
                >
                  {isLoading ? 'Processing...' : confirmText}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}