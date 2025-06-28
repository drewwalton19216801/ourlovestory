import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRelationships } from './useRelationships';
import { useAuth } from '../contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'relationship_request' | 'memory_reaction' | 'memory_comment';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionData?: {
    requestId?: string;
    requesterName?: string;
    relationshipType?: string;
    memoryId?: string;
    memoryTitle?: string;
    userName?: string;
    reactionType?: string;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const { pendingRequests } = useRelationships();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Helper function to fetch memory details
  const fetchMemoryDetails = async (memoryId: string) => {
    try {
      const { data: memory, error } = await supabase
        .from('memories')
        .select('id, title, author_id, author_name')
        .eq('id', memoryId)
        .single();

      if (error) throw error;
      return memory;
    } catch (error) {
      console.error('Error fetching memory details:', error);
      return null;
    }
  };

  // Helper function to get user display name
  const getUserDisplayName = async (userId: string): Promise<string> => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      
      if (profile?.display_name) {
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

  // Convert pending relationship requests to notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const relationshipNotifications: Notification[] = pendingRequests.map(request => ({
      id: `relationship_${request.id}`,
      type: 'relationship_request' as const,
      title: 'New Relationship Request',
      message: `${request.partner_name} wants to connect as your ${request.relationship_type}`,
      createdAt: request.created_at,
      read: false,
      actionData: {
        requestId: request.id,
        requesterName: request.partner_name,
        relationshipType: request.relationship_type
      }
    }));

    setNotifications(prev => {
      // Keep existing non-relationship notifications and add new relationship ones
      const nonRelationshipNotifications = prev.filter(n => n.type !== 'relationship_request');
      return [...nonRelationshipNotifications, ...relationshipNotifications];
    });
  }, [user, pendingRequests]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) {
      return;
    }

    // Subscribe to new relationship requests
    const relationshipChannel = supabase
      .channel('relationship_requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'relationships',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New relationship request received:', payload);
          
          if (payload.new.status === 'pending') {
            // Get requester's display name
            const requesterName = await getUserDisplayName(payload.new.requester_id);
            
            const notification: Notification = {
              id: `relationship_${payload.new.id}`,
              type: 'relationship_request',
              title: 'New Relationship Request',
              message: `${requesterName} wants to connect as your ${payload.new.relationship_type}`,
              createdAt: payload.new.created_at,
              read: false,
              actionData: {
                requestId: payload.new.id,
                requesterName: requesterName,
                relationshipType: payload.new.relationship_type
              }
            };

            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === notification.id);
              if (!exists) {
                return [notification, ...prev];
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new reactions on user's memories
    const reactionChannel = supabase
      .channel('memory_reactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions'
        },
        async (payload) => {
          console.log('New reaction received:', payload);
          
          // Don't notify about own reactions
          if (payload.new.user_id === user.id) {
            return;
          }

          // Get memory details to check if current user is the author
          const memory = await fetchMemoryDetails(payload.new.memory_id);
          
          if (memory && memory.author_id === user.id) {
            const reactionEmoji = {
              heart: '❤️',
              smile: '😊',
              celebration: '🎉'
            }[payload.new.reaction_type] || '👍';

            const notification: Notification = {
              id: `reaction_${payload.new.id}`,
              type: 'memory_reaction',
              title: 'New Reaction',
              message: `${payload.new.user_name} reacted ${reactionEmoji} to "${memory.title}"`,
              createdAt: payload.new.created_at,
              read: false,
              actionData: {
                memoryId: memory.id,
                memoryTitle: memory.title,
                userName: payload.new.user_name,
                reactionType: payload.new.reaction_type
              }
            };

            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === notification.id);
              if (!exists) {
                return [notification, ...prev];
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new comments on user's memories
    const commentChannel = supabase
      .channel('memory_comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          console.log('New comment received:', payload);
          
          // Don't notify about own comments
          if (payload.new.user_id === user.id) {
            return;
          }

          // Get memory details to check if current user is the author
          const memory = await fetchMemoryDetails(payload.new.memory_id);
          
          if (memory && memory.author_id === user.id) {
            const notification: Notification = {
              id: `comment_${payload.new.id}`,
              type: 'memory_comment',
              title: 'New Comment',
              message: `${payload.new.user_name} commented on "${memory.title}"`,
              createdAt: payload.new.created_at,
              read: false,
              actionData: {
                memoryId: memory.id,
                memoryTitle: memory.title,
                userName: payload.new.user_name
              }
            };

            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === notification.id);
              if (!exists) {
                return [notification, ...prev];
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Cleaning up notification subscriptions');
      supabase.removeChannel(relationshipChannel);
      supabase.removeChannel(reactionChannel);
      supabase.removeChannel(commentChannel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}