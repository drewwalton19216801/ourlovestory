import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useProfile } from '../../hooks/useProfile';
import toast from 'react-hot-toast';

interface ProfileFormData {
  display_name: string;
  bio: string;
}

export function ProfileSettings() {
  const { profile, updateProfile, loading } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProfileFormData>({
    defaultValues: {
      display_name: profile?.display_name || '',
      bio: profile?.bio || ''
    }
  });

  // Reset form when profile loads or editing starts
  React.useEffect(() => {
    if (profile && isEditing) {
      reset({
        display_name: profile.display_name || '',
        bio: profile.bio || ''
      });
    }
  }, [profile, isEditing, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile || isUpdating) return;

    setIsUpdating(true);
    try {
      await updateProfile({
        display_name: data.display_name.trim(),
        bio: data.bio.trim()
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({
      display_name: profile?.display_name || '',
      bio: profile?.bio || ''
    });
  };

  const displayName = watch('display_name');
  const bio = watch('bio');

  if (loading || !profile) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Profile Settings</h2>
        <p className="text-gray-400 mb-6">Manage your profile information and how others see you</p>
      </div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Profile Information</h3>
                <p className="text-sm text-gray-400">Update your display name and bio</p>
              </div>
            </div>
            
            {!isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors border border-purple-500/30"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </motion.button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  {...register('display_name', { 
                    required: 'Display name is required',
                    minLength: {
                      value: 2,
                      message: 'Display name must be at least 2 characters'
                    },
                    maxLength: {
                      value: 50,
                      message: 'Display name must be less than 50 characters'
                    }
                  })}
                  type="text"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="How should others see you?"
                />
                {errors.display_name && (
                  <p className="mt-1 text-sm text-red-400">{errors.display_name.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  This is how your name appears on memories and to other users.
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  {...register('bio', {
                    maxLength: {
                      value: 500,
                      message: 'Bio must be less than 500 characters'
                    }
                  })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Tell others a bit about yourself..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
                )}
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">Share a bit about yourself with others.</p>
                  <p className="text-xs text-gray-500">{bio?.length || 0}/500</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isUpdating || !displayName?.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </motion.button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Display Name Display */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Display Name
                </label>
                <p className="text-white text-lg font-medium">
                  {profile.display_name || 'No display name set'}
                </p>
              </div>

              {/* Bio Display */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Bio
                </label>
                <p className="text-gray-300 leading-relaxed">
                  {profile.bio || 'No bio added yet.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Profile Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
      >
        <div className="flex items-start space-x-3">
          <User className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium mb-1">Profile Tips</p>
            <ul className="text-blue-200/80 space-y-1">
              <li>• Your display name appears on all memories you create</li>
              <li>• Choose a name that your partner(s) will recognize</li>
              <li>• Your bio helps others learn about you when connecting</li>
              <li>• You can update your profile information anytime</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}