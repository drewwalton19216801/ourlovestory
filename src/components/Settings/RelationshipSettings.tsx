import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Heart, Check, X, Mail, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRelationships } from '../../hooks/useRelationships';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ConfirmationModal } from '../UI/ConfirmationModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface RelationshipRequestData {
  email: string;
  relationshipType: 'romantic' | 'partnership' | 'friendship' | 'other';
}

interface FindUserResponse {
  user?: {
    id: string;
    display_name: string;
  };
  error?: string;
}

export function RelationshipSettings() {
  const { relationships, pendingRequests, respondToRequest, removeRelationship, refetch } = useRelationships();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [relationshipToDelete, setRelationshipToDelete] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RelationshipRequestData>();

  const relationshipTypes = [
    { value: 'romantic', label: 'Romantic Partner', icon: Heart },
    { value: 'partnership', label: 'Life Partner', icon: Users },
    { value: 'friendship', label: 'Close Friend', icon: Users },
    { value: 'other', label: 'Other', icon: Users },
  ];

  const findUserByEmail = async (email: string): Promise<FindUserResponse> => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-user`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.error || 'Failed to find user' };
      }

      return data;
    } catch (error) {
      console.error('Error calling find-user function:', error);
      return { error: 'Network error occurred while searching for user' };
    }
  };

  const onSubmit = async (data: RelationshipRequestData) => {
    if (!user) {
      toast.error('You must be logged in to send relationship requests');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the edge function to find the user
      const findResult = await findUserByEmail(data.email);
      
      if (findResult.error || !findResult.user) {
        toast.error(findResult.error || 'User not found. Please check the email address.');
        return;
      }

      // Send the relationship request with requester_id explicitly set
      const { error: requestError } = await supabase
        .from('relationships')
        .insert([{
          requester_id: user.id,
          receiver_id: findResult.user.id,
          relationship_type: data.relationshipType,
          status: 'pending'
        }]);

      if (requestError) throw requestError;

      toast.success('Relationship request sent successfully!');
      reset();
      refetch();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You already have a relationship with this user.');
      } else {
        toast.error(error.message || 'Failed to send relationship request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await respondToRequest(requestId, true);
      toast.success('Relationship request accepted!');
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await respondToRequest(requestId, false);
      toast.success('Relationship request declined');
    } catch (error) {
      toast.error('Failed to decline request');
    }
  };

  const handleDeleteClick = (relationshipId: string) => {
    setRelationshipToDelete(relationshipId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!relationshipToDelete) return;

    try {
      await removeRelationship(relationshipToDelete);
      toast.success('Relationship removed successfully');
      setDeleteModalOpen(false);
      setRelationshipToDelete(null);
    } catch (error) {
      toast.error('Failed to remove relationship');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setRelationshipToDelete(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="hidden lg:block">
          <h2 className="text-xl font-semibold text-white mb-2">Relationship Settings</h2>
          <p className="text-gray-400 mb-6">Connect with partners and friends to share memories together</p>
        </div>

        {/* Send Relationship Request */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10"
        >
          <div className="flex items-center space-x-3 mb-4">
            <UserPlus className="h-5 w-5 text-purple-400" />
            <h3 className="text-base sm:text-lg font-medium text-white">Send Relationship Request</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter their email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Relationship Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relationshipTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label key={type.value} className="cursor-pointer">
                      <input
                        {...register('relationshipType')}
                        type="radio"
                        value={type.value}
                        defaultChecked={type.value === 'romantic'}
                        className="sr-only peer"
                      />
                      <div className="flex items-center p-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors peer-checked:bg-purple-500/20 peer-checked:border-purple-500">
                        <Icon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-300">{type.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
            >
              {isSubmitting ? 'Sending Request...' : 'Send Request'}
            </motion.button>
          </form>
        </motion.div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10"
          >
            <h3 className="text-base sm:text-lg font-medium text-white mb-4">Pending Requests</h3>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg gap-3">
                  <div>
                    <p className="text-white font-medium">{request.partner_name}</p>
                    <p className="text-sm text-gray-400 capitalize">
                      {request.relationship_type} • {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAcceptRequest(request.id)}
                      className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeclineRequest(request.id)}
                      className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Current Relationships */}
        {relationships.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10"
          >
            <h3 className="text-base sm:text-lg font-medium text-white mb-4">Connected Partners</h3>
            <div className="space-y-3">
              {relationships.map((relationship) => (
                <div key={relationship.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-300">
                        {relationship.partner_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{relationship.partner_name}</p>
                      <p className="text-sm text-gray-400 capitalize">
                        {relationship.relationship_type}
                        {relationship.is_primary && ' • Primary'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteClick(relationship.id)}
                    className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors self-end sm:self-center"
                    title="Remove relationship"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">About Relationships</p>
              <ul className="text-blue-200/80 space-y-1">
                <li>• Connected partners can be tagged in memories and see private posts shared with them</li>
                <li>• Relationship requests must be accepted by both parties</li>
                <li>• You can have multiple relationships of different types</li>
                <li>• Either party can remove a relationship at any time</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Remove Relationship"
        message="Are you sure you want to remove this relationship? This will prevent you from tagging each other in memories and sharing private content."
        confirmText="Remove"
        cancelText="Cancel"
        isDestructive={true}
      />
    </>
  );
}