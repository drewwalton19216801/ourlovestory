import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { MapPin, Globe, Lock, Heart, ArrowLeft, X, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRelationships } from '../../hooks/useRelationships';
import { useMemories } from '../../hooks/useMemories';
import { Memory, MemoryCategory } from '../../types';
import { PartnerSelector } from './PartnerSelector';
import { ImageUpload } from './ImageUpload';
import { extractStoragePath } from '../../lib/storage';
import toast from 'react-hot-toast';

interface EditMemoryFormProps {
  memory: Memory;
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

export function EditMemoryForm({ memory }: EditMemoryFormProps) {
  const { user } = useAuth();
  const { relationships } = useRelationships();
  const { updateMemory } = useMemories();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(memory.images || []);
  const [newlySelectedImageFiles, setNewlySelectedImageFiles] = useState<File[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      title: memory.title,
      description: memory.description,
      location: memory.location || '',
      category: memory.category as MemoryCategory,
      is_public: memory.is_public,
    },
  });

  const isPublic = watch('is_public');

  // Initialize selected partners from existing participants
  useEffect(() => {
    if (memory.participants && memory.participants.length > 0) {
      const participantIds = memory.participants.map(p => p.user_id);
      setSelectedPartners(participantIds);
    }
  }, [memory.participants]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const updatedMemory = await updateMemory(
        memory.id,
        {
          title: data.title,
          description: data.description,
          location: data.location,
          category: data.category,
          is_public: data.is_public,
        },
        existingImageUrls,
        newlySelectedImageFiles
      );

      // Update participants if any changes
      if (selectedPartners.length !== (memory.participants?.length || 0) || 
          !selectedPartners.every(id => memory.participants?.some(p => p.user_id === id))) {
        
        const { supabase } = await import('../../lib/supabase');
        
        // Remove existing participants
        await supabase
          .from('memory_participants')
          .delete()
          .eq('memory_id', memory.id);

        // Add new participants
        if (selectedPartners.length > 0) {
          const participantInserts = selectedPartners.map(partnerId => {
            const partner = relationships.find(r => r.partner_id === partnerId);
            return {
              memory_id: memory.id,
              user_id: partnerId,
              user_name: partner?.partner_name || 'Anonymous'
            };
          });

          await supabase
            .from('memory_participants')
            .insert(participantInserts);
        }
      }

      toast.success('Memory updated successfully!');
      navigate(`/memory/${memory.id}`);
    } catch (error) {
      toast.error('Failed to update memory');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewFilesSelected = (files: File[]) => {
    setNewlySelectedImageFiles(files);
  };

  const removeExistingImage = (imageUrl: string) => {
    setExistingImageUrls(prev => prev.filter(url => url !== imageUrl));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Edit Memory</h1>
            <p className="text-gray-400">Update your memory details and images</p>
          </div>
          <Link
            to={`/memory/${memory.id}`}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Cancel editing"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>

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

          {/* Date Display */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-purple-400" />
              <p className="text-purple-300 text-sm">
                Memory date: <span className="font-medium">{new Date(memory.date).toLocaleDateString()}</span>
              </p>
            </div>
            <p className="text-purple-200/80 text-xs mt-1">
              The memory date cannot be changed when editing.
            </p>
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

          {/* Partner Selector */}
          <PartnerSelector
            relationships={relationships}
            selectedPartners={selectedPartners}
            onPartnersChange={setSelectedPartners}
            disabled={isSubmitting}
          />

          {/* Existing Images */}
          {existingImageUrls.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Current Images
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {existingImageUrls.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Existing image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-white/20"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeExistingImage(imageUrl)}
                      disabled={isSubmitting}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Add New Images
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
                  {isPublic ? 'Visible to everyone' : 'Only visible to you and tagged partners'}
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Updating Memory...' : 'Update Memory'}
            </motion.button>

            <Link
              to={`/memory/${memory.id}`}
              className="flex-1 py-4 bg-white/10 text-gray-300 font-medium rounded-lg hover:bg-white/20 hover:text-white transition-all border border-white/20 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}