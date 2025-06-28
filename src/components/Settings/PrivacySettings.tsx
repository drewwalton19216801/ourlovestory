import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Lock, Eye, EyeOff } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import toast from 'react-hot-toast';

export function PrivacySettings() {
  const { profile, updateProfile, loading } = useProfile();
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const handleTogglePublicProfile = async () => {
    if (!profile || isUpdatingPublic) return;
    
    setIsUpdatingPublic(true);
    try {
      await updateProfile({
        is_public_profile: !profile.is_public_profile
      });
      toast.success(`Profile is now ${!profile.is_public_profile ? 'public' : 'private'}`);
    } catch (error) {
      toast.error('Failed to update profile visibility');
      console.error(error);
    } finally {
      setIsUpdatingPublic(false);
    }
  };

  const handleToggleDefaultPostPrivacy = async () => {
    if (!profile || isUpdatingPrivacy) return;
    
    setIsUpdatingPrivacy(true);
    try {
      await updateProfile({
        default_post_privacy: !profile.default_post_privacy
      });
      toast.success(`New memories will be ${!profile.default_post_privacy ? 'public' : 'private'} by default`);
    } catch (error) {
      toast.error('Failed to update default post privacy');
      console.error(error);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

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
        <h2 className="text-xl font-semibold text-white mb-2">Privacy Settings</h2>
        <p className="text-gray-400 mb-6">Control who can see your profile and posts</p>
      </div>

      {/* Profile Visibility */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-lg p-6 border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full transition-colors duration-200 ${
              profile.is_public_profile ? 'bg-green-500/20' : 'bg-gray-500/20'
            }`}>
              {profile.is_public_profile ? (
                <Globe className="h-6 w-6 text-green-400 transition-colors duration-200" />
              ) : (
                <Lock className="h-6 w-6 text-gray-400 transition-colors duration-200" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Public Profile</h3>
              <p className="text-sm text-gray-400 transition-all duration-200">
                {profile.is_public_profile 
                  ? 'Your profile is visible to everyone'
                  : 'Your profile is only visible to connected partners'
                }
              </p>
            </div>
          </div>
          <div className="relative">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.is_public_profile || false}
                onChange={handleTogglePublicProfile}
                disabled={isUpdatingPublic}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer transition-all duration-200 ${
                profile.is_public_profile ? 'bg-purple-600' : 'bg-gray-600'
              } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 ${
                profile.is_public_profile ? 'peer-checked:after:translate-x-full' : ''
              } peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 ${
                profile.is_public_profile ? 'after:translate-x-full' : 'after:translate-x-0'
              } ${isUpdatingPublic ? 'opacity-50 cursor-not-allowed' : ''}`}>
              </div>
            </label>
            {isUpdatingPublic && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Default Post Privacy */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 rounded-lg p-6 border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full transition-colors duration-200 ${
              profile.default_post_privacy ? 'bg-blue-500/20' : 'bg-gray-500/20'
            }`}>
              {profile.default_post_privacy ? (
                <Eye className="h-6 w-6 text-blue-400 transition-colors duration-200" />
              ) : (
                <EyeOff className="h-6 w-6 text-gray-400 transition-colors duration-200" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Default Post Privacy</h3>
              <p className="text-sm text-gray-400 transition-all duration-200">
                {profile.default_post_privacy 
                  ? 'New memories will be public by default'
                  : 'New memories will be private by default'
                }
              </p>
            </div>
          </div>
          <div className="relative">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.default_post_privacy || false}
                onChange={handleToggleDefaultPostPrivacy}
                disabled={isUpdatingPrivacy}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer transition-all duration-200 ${
                profile.default_post_privacy ? 'bg-purple-600' : 'bg-gray-600'
              } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 ${
                profile.default_post_privacy ? 'peer-checked:after:translate-x-full' : ''
              } peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 ${
                profile.default_post_privacy ? 'after:translate-x-full' : 'after:translate-x-0'
              } ${isUpdatingPrivacy ? 'opacity-50 cursor-not-allowed' : ''}`}>
              </div>
            </label>
            {isUpdatingPrivacy && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Privacy Information */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4"
      >
        <div className="flex items-start space-x-3">
          <Lock className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-purple-300 font-medium mb-1">Privacy Controls</p>
            <ul className="text-purple-200/80 space-y-1">
              <li>• Public profiles can be viewed by anyone visiting the site</li>
              <li>• Private profiles are only visible to your connected partners</li>
              <li>• You can override the default privacy setting for individual memories</li>
              <li>• Private memories are never visible to the public regardless of profile settings</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}