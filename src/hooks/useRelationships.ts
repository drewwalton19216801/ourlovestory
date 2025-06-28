import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Relationship, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';

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
      const pending = relationshipsWithPartnerInfo.filter(r => r.status === 'pending');

      setRelationships(accepted);
      setPendingRequests(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch relationships');
    } finally {
      setLoading(false);
    }
  };

  const sendRelationshipRequest = async (receiverEmail: string, relationshipType: string = 'romantic') => {
    if (!user) return;

    try {
      // First, find the user by email (this would require a function or different approach)
      // For now, we'll assume we have the receiver_id
      const { data, error } = await supabase
        .from('relationships')
        .insert([{
          requester_id: user.id,
          receiver_id: receiverEmail, // This should be receiver_id in actual implementation
          relationship_type: relationshipType,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchRelationships();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to send relationship request');
    }
  };

  const respondToRequest = async (relationshipId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .update({ 
          status: accept ? 'accepted' : 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', relationshipId);

      if (error) throw error;

      await fetchRelationships();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to respond to request');
    }
  };

  const removeRelationship = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      await fetchRelationships();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove relationship');
    }
  };

  const updateRelationship = async (relationshipId: string, updates: Partial<Relationship>) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', relationshipId);

      if (error) throw error;

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