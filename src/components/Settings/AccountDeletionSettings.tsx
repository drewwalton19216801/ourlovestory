import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, UserX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmationModal } from '../UI/ConfirmationModal';
import toast from 'react-hot-toast';

export function AccountDeletionSettings() {
  const { user, session, signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || !session) {
      toast.error('You must be signed in to delete your account');
      return;
    }

    setIsDeleting(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-data`;
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Account deleted successfully
      toast.success('Your account has been deleted successfully');
      
      // Sign out and redirect (the user session is now invalid)
      setTimeout(async () => {
        try {
          await signOut();
        } catch {
          // If signOut fails (expected since user is deleted), just reload the page
          window.location.href = '/';
        }
      }, 1500);

    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="hidden lg:block">
          <h2 className="text-xl font-semibold text-white mb-2">Account Deletion</h2>
          <p className="text-gray-400 mb-6">Permanently delete your account and all associated data</p>
        </div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 sm:p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <h3 className="text-lg font-medium text-red-300">Danger Zone</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
              <h4 className="text-red-300 font-medium mb-2">⚠️ This action cannot be undone</h4>
              <p className="text-red-200/80 text-sm leading-relaxed mb-4">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-red-200/80 text-sm space-y-1 ml-4">
                <li>• Your user profile and account information</li>
                <li>• All memories you have created</li>
                <li>• All photos and images you have uploaded</li>
                <li>• All your comments and reactions</li>
                <li>• All your relationship connections</li>
                <li>• All memory participations and tags</li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <h4 className="text-amber-300 font-medium mb-2">📋 Before you delete your account</h4>
              <ul className="text-amber-200/80 text-sm space-y-1">
                <li>• Download any photos or memories you want to keep</li>
                <li>• Inform your connected partners about your account deletion</li>
                <li>• Consider if you might want to return to Our Love Story in the future</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2">🔒 Data Privacy</h4>
              <p className="text-blue-200/80 text-sm leading-relaxed">
                Once deleted, your data cannot be recovered by you or our team. We take data privacy seriously 
                and ensure complete removal of your information from our systems.
              </p>
            </div>

            {/* Delete Button */}
            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600/20 text-red-300 font-medium rounded-lg hover:bg-red-600/30 transition-all border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete My Account Forever</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Account Deletion Process */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <UserX className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-gray-300 font-medium mb-1">Account Deletion Process</p>
              <ol className="text-gray-400 space-y-1 list-decimal list-inside">
                <li>Click "Delete My Account Forever" above</li>
                <li>Confirm your decision in the security dialog</li>
                <li>Your account and all data will be permanently deleted</li>
                <li>You will be automatically signed out</li>
                <li>Your account cannot be recovered after deletion</li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* Alternative Options */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-purple-300 font-medium mb-1">Consider These Alternatives</p>
              <ul className="text-purple-200/80 space-y-1">
                <li>• You can make your profile private instead of deleting</li>
                <li>• Individual memories can be deleted without removing your account</li>
                <li>• You can disconnect from specific relationships if needed</li>
                <li>• Contact support if you have concerns about your account</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteAccount}
        title="Delete Account Forever"
        message="Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone. All your memories, photos, comments, reactions, and connections will be permanently deleted."
        confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
}