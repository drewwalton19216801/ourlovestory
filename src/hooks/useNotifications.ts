import { useState, useEffect } from 'react';
import { useRelationships } from './useRelationships';
import { useAuth } from '../contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'relationship_request' | 'memory_reaction' | 'memory_comment';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionData?: any;
}

export function useNotifications() {
  const { user } = useAuth();
  const { pendingRequests } = useRelationships();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Convert pending relationship requests to notifications
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

    setNotifications(relationshipNotifications);
  }, [user, pendingRequests]);

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