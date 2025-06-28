import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Send, Heart, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import toast from 'react-hot-toast';

interface InvitationFormData {
  email: string;
  personalMessage: string;
}

interface InvitationResult {
  email: string;
  timestamp: string;
}

export function InviteFriends() {
  const { user, session } = useAuth();
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentInvitations, setRecentInvitations] = useState<InvitationResult[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<InvitationFormData>({
    defaultValues: {
      personalMessage: `Hi! I'm using Our Love Story to create a beautiful timeline of my relationship, and I thought you might enjoy it too. It's a great way to share precious memories with loved ones. Hope you'll join me!`
    }
  });

  const personalMessage = watch('personalMessage');

  const sendInvitation = async (email: string, personalMessage?: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteeEmail: email,
          personalMessage: personalMessage?.trim() || undefined
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      return data;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send invitation');
    }
  };

  const onSubmit = async (data: InvitationFormData) => {
    if (!user) {
      toast.error('You must be signed in to send invitations');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendInvitation(data.email, data.personalMessage);
      
      // Add to recent invitations
      const newInvitation: InvitationResult = {
        email: data.email,
        timestamp: new Date().toISOString()
      };
      setRecentInvitations(prev => [newInvitation, ...prev.slice(0, 4)]);
      
      toast.success(`Invitation sent to ${data.email}!`);
      reset({
        email: '',
        personalMessage: data.personalMessage // Keep the personal message
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="hidden lg:block">
        <h2 className="text-xl font-semibold text-white mb-2">Invite Friends & Family</h2>
        <p className="text-gray-400 mb-6">Share Our Love Story with people you care about</p>
      </div>

      {/* Invitation Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10"
      >
        <div className="flex items-center space-x-3 mb-6">
          <UserPlus className="h-6 w-6 text-purple-400" />
          <h3 className="text-lg font-medium text-white">Send an Invitation</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Input */}
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
              placeholder="friend@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              {...register('personalMessage', {
                maxLength: {
                  value: 500,
                  message: 'Message must be less than 500 characters'
                }
              })}
              rows={4}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base"
              placeholder="Add a personal touch to your invitation..."
            />
            {errors.personalMessage && (
              <p className="mt-1 text-sm text-red-400">{errors.personalMessage.message}</p>
            )}
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                This message will be included in the invitation email.
              </p>
              <p className="text-xs text-gray-500">{personalMessage?.length || 0}/500</p>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Sending Invitation...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Invitation</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Recent Invitations */}
      {recentInvitations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10"
        >
          <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span>Recent Invitations</span>
          </h3>
          <div className="space-y-3">
            {recentInvitations.map((invitation, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white font-medium">{invitation.email}</span>
                </div>
                <span className="text-xs text-green-300">
                  {new Date(invitation.timestamp).toLocaleDateString()} at {' '}
                  {new Date(invitation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
      >
        <div className="flex items-start space-x-3">
          <Heart className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium mb-1">About Invitations</p>
            <ul className="text-blue-200/80 space-y-1">
              <li>• Invitations are sent directly to the recipient's email</li>
              <li>• Recipients can join Our Love Story and connect with you</li>
              <li>• No spam - this is a one-time invitation email</li>
              <li>• Your personal message helps explain why you're inviting them</li>
              <li>• Compliant with CAN-SPAM regulations</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* CAN-SPAM Compliance Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4"
      >
        <div className="text-sm">
          <p className="text-gray-300 font-medium mb-1">Email Compliance</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            All invitation emails comply with CAN-SPAM regulations. Recipients receive a clear explanation 
            of why they're receiving the email, can easily opt out, and won't receive further emails unless 
            they create an account. We respect privacy and never send unsolicited promotional emails.
          </p>
        </div>
      </motion.div>
    </div>
  );
}