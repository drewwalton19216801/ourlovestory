import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { MapPin, Globe, Lock, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { Memory, MemoryCategory, SelectedUser } from '../../types';
import { useNavigate } from 'react-router-dom';
import { UserMultiSelect } from './UserMultiSelect';
import { ImageUpload } from './ImageUpload';
import { uploadImages } from '../../lib/storage';
import toast from 'react-hot-toast';

interface AddMemoryFormProps {
  onAddMemory: (memory: Omit<Memory, 'id' | 'created_at' | 'updated_at' | 'reactions' | 'comments'>) => Promise<Memory>;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  category: MemoryCategory;
  is_public: boolean;
}

const categories = [
  { value: 'first_date', label: 'First Date', icon: Heart },
  { value: 'anniversary', label: 'Anniversary', icon: Heart },
  { value: 'proposal', label: 'Proposal', icon: Heart },
  { value: 'wedding', label: 'Wedding', icon: Heart },
  { value: 'vacation', label: 'Vacation', icon: MapPin },
  { value: 'milestone', label: 'Milestone', icon: Heart },
  { value: 'special_moment', label: 'Special Moment', icon: Heart },
  { value: 'everyday_joy', label: 'Everyday Joy', icon: Heart },
];

// Helper function to get user display name with UUID protection
const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const { supabase } = await import('../../lib/supabase');
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single();
    
    // Return display_name if it exists and is not a UUID or email address
    if (profile?.display_name) {
      // Check if display_name is a UUID pattern
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(profile.display_name)) {
        return 'Anonymous';
      }
      
      // Check if display_name looks like an email
      if (profile.display_name.includes('@') && profile.display_name.includes('.')) {
        // Try to extract a better name from email
        const emailPrefix = profile.display_name.split('@')[0];
        if (emailPrefix.length > 2 && !emailPrefix.includes('+')) {
          return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        }
        return 'Anonymous';
      }
      return profile.display_name;
    }
    
    return 'Anonymous';
  } catch {
    return 'Anonymous';
  }
};

export function AddMemoryForm({ onAddMemory }: AddMemoryFormProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlySelectedImageFiles, setNewlySelectedImageFiles] = useState<File[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);

  // Use user's default privacy setting if available
  const defaultPrivacy = profile?.default_post_privacy ?? true;

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      is_public: defaultPrivacy,
      category: 'special_moment',
    },
  });

  const isPublic = watch('is_public');

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Use current date for the memory
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Get the author name from profile, ensuring it's not a UUID or email address
      const authorName = await getUserDisplayName(user.id);
      
      // Upload images first if any are selected
      let imageUrls: string[] = [];
      if (newlySelectedImageFiles.length > 0) {
        try {
          const uploadResults = await uploadImages(newlySelectedImageFiles, user.id);
          imageUrls = uploadResults.map(result => result.url);
          toast.success(`${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} uploaded successfully!`);
        } catch (uploadError) {
          toast.error('Failed to upload images. Please try again.');
          console.error('Image upload error:', uploadError);
          setIsSubmitting(false);
          return;
        }
      }
      
      const memory = {
        ...data,
        date: currentDate,
        images: imageUrls,
        author_id: user.id,
        author_name: authorName,
      };

      const newMemory = await onAddMemory(memory);
      
      // Add participants if any are selected
      if (selectedUsers.length > 0) {
        const { supabase } = await import('../../lib/supabase');
        const participantInserts = selectedUsers.map(selectedUser => ({
          memory_id: newMemory.id,
          user_id: selectedUser.id,
          user_name: selectedUser.display_name
        }));

        await supabase
          .from('memory_participants')
          .insert(participantInserts);
      }

      toast.success('Memory added successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to add memory');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewFilesSelected = (files: File[]) => {
    setNewlySelectedImageFiles(files);
  };

  const handleUsersChange = (users: SelectedUser[]) => {
    setSelectedUsers(users);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8"
      >
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Add New Memory</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Give your memory a beautiful title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Tell the story of this beautiful moment..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Auto-set Date Notice */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-purple-400" />
              <p className="text-purple-300 text-sm">
                This memory will be posted with today's date: <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location (Optional)
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Where did this happen?"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <label key={category.value} className="cursor-pointer">
                    <input
                      {...register('category')}
                      type="radio"
                      value={category.value}
                      className="sr-only peer"
                    />
                    <div className="flex flex-col items-center p-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors peer-checked:bg-purple-500/20 peer-checked:border-purple-500">
                      <Icon className="h-5 w-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-300 text-center">{category.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* User Multi-Select */}
          <UserMultiSelect
            selectedUsers={selectedUsers}
            onUsersChange={handleUsersChange}
            disabled={isSubmitting}
          />

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Images
            </label>
            <ImageUpload
              onNewFilesSelected={handleNewFilesSelected}
              disabled={isSubmitting}
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
            <div className="flex items-center space-x-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-green-400" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="text-white font-medium">
                  {isPublic ? 'Public Memory' : 'Private Memory'}
                </p>
                <p className="text-sm text-gray-400">
                  {isPublic ? 'Visible to everyone' : 'Only visible to you and tagged people'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                {...register('is_public')}
                type="checkbox"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Adding Memory...' : 'Add Memory'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}