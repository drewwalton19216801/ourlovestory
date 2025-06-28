import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Relationship, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateRelationshipRequestEmail } from '../lib/emailTemplates';

export function useRelationships() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRelationships = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all relationships where user is involved
      const { data, error } = await supabase
        .from('relationships')
        .select(`
          *,
          requester:user_profiles!requester_id(display_name),
          receiver:user_profiles!receiver_id(display_name)
        `)
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) throw error;

      const relationshipsWithPartnerInfo = (data || []).map(rel => ({
        ...rel,
        partner_id: rel.requester_id === user.id ? rel.receiver_id : rel.requester_id,
        partner_name: rel.requester_id === user.id 
          ? rel.receiver?.display_name || 'Anonymous'
          : rel.requester?.display_name || 'Anonymous'
      }));

      const accepted = relationshipsWithPartnerInfo.filter(r => r.status === 'accepted');
      // Only show pending requests where the current user is the RECEIVER
      const pending = relationshipsWithPartnerInfo.filter(r => 
        r.status === 'pending' && r.receiver_id === user.id
      );

      setRelationships(accepted);
      setPendingRequests(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch relationships');
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationEmail = async (receiverId: string, requesterName: string, relationshipType: string) => {
    try {
      // Get receiver's email
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(receiverId);
      
      if (userError || !userData.user) {
        console.warn('Could not fetch user email for notification:', userError);
        return; // Don't fail the relationship request if email fails
      }

      // Get receiver's display name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', receiverId)
        .single();

      const receiverName = profile?.display_name || userData.user.email || 'there';
      const appUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      
      const emailHtml = generateRelationshipRequestEmail({
        receiverName,
        requesterName,
        relationshipType,
        appUrl,
        siteName: 'Our Love Story'
      });

      const emailApiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email-resend`;
      
      const response = await fetch(emailApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userData.user.email,
          subject: `${requesterName} wants to connect with you on Our Love Story`,
          html: emailHtml
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Failed to send notification email:', errorData);
        // Don't throw - we don't want to fail the relationship request if email fails
      }
    } catch (error) {
      console.warn('Error sending notification email:', error);
      // Don't throw - we don't want to fail the relationship request if email fails
    }
  };

  const sendRelationshipRequest = async (receiverEmail: string, relationshipType: string = 'romantic') => {
    if (!user) return;

    try {
      // First, find the user by email using the edge function
      const findUserApiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-user`;
      
      const findResponse = await fetch(findUserApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: receiverEmail }),
      });

      const findResult = await findResponse.json();
      
      if (!findResponse.ok || !findResult.user) {
        throw new Error(findResult.error || 'User not found. Please check the email address.');
      }

      // Get requester's display name for the notification
      const { data: requesterProfile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const requesterName = requesterProfile?.display_name || user.email || 'Someone';

      // Send the relationship request
      const { data, error } = await supabase
        .from('relationships')
        .insert([{
          requester_id: user.id,
          receiver_id: findResult.user.id,
          relationship_type: relationshipType,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Send notification email (don't await to avoid blocking)
      sendNotificationEmail(findResult.user.id, requesterName, relationshipType);

      await fetchRelationships();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to send relationship request');
    }
  };

  const respondToRequest = async (relationshipId: string, accept: boolean) => {
    if (!user) {
      throw new Error('User must be authenticated to respond to requests');
    }

    try {
      // First, verify that the current user is the receiver of this request
      const { data: relationship, error: fetchError } = await supabase
        .from('relationships')
        .select('receiver_id, status')
        .eq('id', relationshipId)
        .single();

      if (fetchError) {
        throw new Error('Failed to find relationship request');
      }

      if (!relationship) {
        throw new Error('Relationship request not found');
      }

      if (relationship.receiver_id !== user.id) {
        throw new Error('You can only respond to requests sent to you');
      }

      if (relationship.status !== 'pending') {
        throw new Error('This request has already been responded to');
      }

      // Update the relationship status
      const { error } = await supabase
        .from('relationships')
        .update({ 
          status: accept ? 'accepted' : 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', relationshipId)
        .eq('receiver_id', user.id) // Double-check security
        .eq('status', 'pending'); // Only update if still pending

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Request not found or you do not have permission to respond to it');
        }
        throw error;
      }

      await fetchRelationships();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to respond to request');
    }
  };

  const removeRelationship = async (relationshipId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to remove relationships');
    }

    try {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Relationship not found or you do not have permission to remove it');
        }
        throw error;
      }

      await fetchRelationships();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove relationship');
    }
  };

  const updateRelationship = async (relationshipId: string, updates: Partial<Relationship>) => {
    if (!user) {
      throw new Error('User must be authenticated to update relationships');
    }

    try {
      // Only allow updating non-status fields for accepted relationships
      const allowedUpdates = { ...updates };
      delete allowedUpdates.status; // Never allow direct status updates
      delete allowedUpdates.requester_id; // Never allow changing parties
      delete allowedUpdates.receiver_id;

      const { error } = await supabase
        .from('relationships')
        .update({
          ...allowedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', relationshipId)
        .eq('status', 'accepted'); // Only allow updates to accepted relationships

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Relationship not found or cannot be updated');
        }
        throw error;
      }

      await fetchRelationships();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update relationship');
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [user]);

  return {
    relationships,
    pendingRequests,
    loading,
    error,
    sendRelationshipRequest,
    respondToRequest,
    removeRelationship,
    updateRelationship,
    refetch: fetchRelationships,
  };
}