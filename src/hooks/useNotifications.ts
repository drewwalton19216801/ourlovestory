import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Helper function to fetch memory details
  const fetchMemoryDetails = async (memoryId: string) => {
    try {
      console.log('[Notifications] Fetching memory details for:', memoryId);
      const { data: memory, error } = await supabase
        .from('memories')
        .select('id, title, author_id, author_name')
        .eq('id', memoryId)
        .single();

      if (error) {
        console.error('[Notifications] Error fetching memory details:', error);
        throw error;
      }
      
      console.log('[Notifications] Memory details fetched:', memory);
      return memory;
    } catch (error) {
      console.error('[Notifications] Error fetching memory details:', error);
      return null;
    }
  };

  // Helper function to get user display name with UUID protection
  const getUserDisplayName = async (userId: string): Promise<string> => {
    try {
      console.log('[Notifications] Getting display name for user:', userId);
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      
      if (profile?.display_name) {
        // Check if display_name is a UUID pattern
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(profile.display_name)) {
          console.log('[Notifications] Display name is UUID, returning Anonymous');
          return 'Anonymous';
        }
        
        // Check if display_name looks like an email
        if (profile.display_name.includes('@') && profile.display_name.includes('.')) {
          // Try to extract a better name from email
          const emailPrefix = profile.display_name.split('@')[0];
          if (emailPrefix.length > 2 && !emailPrefix.includes('+')) {
            const result = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            console.log('[Notifications] Converted email to display name:', result);
            return result;
          }
          console.log('[Notifications] Email prefix too short, returning Anonymous');
          return 'Anonymous';
        }
        console.log('[Notifications] Using profile display name:', profile.display_name);
        return profile.display_name;
      }
      
      console.log('[Notifications] No display name found, returning Anonymous');
      return 'Anonymous';
    } catch (error) {
      console.error('[Notifications] Error getting display name:', error);
      return 'Anonymous';
    }
  };

  // Convert pending relationship requests to notifications
  useEffect(() => {
    if (!user) {
      console.log('[Notifications] No user, clearing notifications');
      setNotifications([]);
      return;
    }

    console.log('[Notifications] Converting pending requests to notifications:', pendingRequests.length);

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
      const combined = [...nonRelationshipNotifications, ...relationshipNotifications];
      console.log('[Notifications] Updated notifications count:', combined.length);
      return combined;
    });
  }, [user, pendingRequests, location.pathname]);

  // Set up real-time subscriptions - REMOVED location.pathname dependency
  useEffect(() => {
    if (!user) {
      console.log('[Notifications] No user, skipping real-time setup');
      return;
    }

    console.log('[Notifications] Setting up real-time subscriptions for user:', user.id);

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
          console.log('[Notifications] New relationship request received:', payload);
          
          if (payload.new.status === 'pending') {
            // Get requester's display name
            const requesterName = await getUserDisplayName(payload.new.requester_id);
            console.log('[Notifications] Requester name resolved:', requesterName);
            
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

            console.log('[Notifications] Adding relationship notification:', notification);

            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === notification.id);
              if (!exists) {
                console.log('[Notifications] Notification added to state');
                return [notification, ...prev];
              }
              console.log('[Notifications] Notification already exists, skipping');
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
          console.log('[Notifications] New reaction received:', payload);
          
          // Don't notify about own reactions
          if (payload.new.user_id === user.id) {
            console.log('[Notifications] Skipping own reaction');
            return;
          }

          // Get memory details to check if current user is the author
          const memory = await fetchMemoryDetails(payload.new.memory_id);
          
          if (memory && memory.author_id === user.id) {
            console.log('[Notifications] Reaction is on current user\'s memory, creating notification');
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

            console.log('[Notifications] Adding reaction notification:', notification);

            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === notification.id);
              if (!exists) {
                console.log('[Notifications] Reaction notification added to state');
                return [notification, ...prev];
              }
              console.log('[Notifications] Reaction notification already exists, skipping');
              return prev;
            });
          } else {
            console.log('[Notifications] Reaction not on current user\'s memory or memory not found:', {
              memoryFound: !!memory,
              memoryAuthor: memory?.author_id,
              currentUser: user.id
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
          console.log('[Notifications] New comment received:', payload);
          
          // Don't notify about own comments
          if (payload.new.user_id === user.id) {
            console.log('[Notifications] Skipping own comment');
            return;
          }

          // Get memory details to check if current user is the author
          const memory = await fetchMemoryDetails(payload.new.memory_id);
          
          if (memory && memory.author_id === user.id) {
            console.log('[Notifications] Comment is on current user\'s memory, creating notification');
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

            console.log('[Notifications] Adding comment notification:', notification);

            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === notification.id);
              if (!exists) {
                console.log('[Notifications] Comment notification added to state');
                return [notification, ...prev];
              }
              console.log('[Notifications] Comment notification already exists, skipping');
              return prev;
            });
          } else {
            console.log('[Notifications] Comment not on current user\'s memory or memory not found:', {
              memoryFound: !!memory,
              memoryAuthor: memory?.author_id,
              currentUser: user.id
            });
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('[Notifications] Cleaning up notification subscriptions');
      supabase.removeChannel(relationshipChannel);
      supabase.removeChannel(reactionChannel);
      supabase.removeChannel(commentChannel);
    };
  }, [user]); // REMOVED location.pathname from dependencies

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    console.log('[Notifications] Marking notification as read:', notificationId);
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    console.log('[Notifications] Marking all notifications as read');
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    console.log('[Notifications] Removing notification:', notificationId);
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