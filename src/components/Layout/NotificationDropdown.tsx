import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Users, Heart, MessageCircle, Check, X, BookMarkedIcon as MarkAsReadIcon } from 'lucide-react';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { useRelationships } from '../../hooks/useRelationships';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const { respondToRequest } = useRelationships();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRelationshipResponse = async (notification: Notification, accept: boolean) => {
    if (!notification.actionData?.requestId || isProcessing) return;

    setIsProcessing(notification.id);
    try {
      await respondToRequest(notification.actionData.requestId, accept);
      
      if (accept) {
        toast.success(`You're now connected with ${notification.actionData.requesterName}!`);
      } else {
        toast.success('Relationship request declined');
      }
      
      removeNotification(notification.id);
    } catch (error) {
      toast.error(`Failed to ${accept ? 'accept' : 'decline'} request`);
    } finally {
      setIsProcessing(null);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'relationship_request':
        return <Users className="h-4 w-4 text-purple-400" />;
      case 'memory_reaction':
        return <Heart className="h-4 w-4 text-pink-400" />;
      case 'memory_comment':
        return <MessageCircle className="h-4 w-4 text-blue-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark notifications as read when opening
      setTimeout(() => markAllAsRead(), 1000);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-300 hover:text-white" />
        
        {/* Notification Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-80 bg-black/90 backdrop-blur-md rounded-xl border border-white/30 shadow-2xl z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">No notifications yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      You'll see relationship requests and other updates here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/20">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-white/10 transition-colors ${
                          !notification.read ? 'bg-purple-500/15' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white mb-1">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-200 leading-relaxed">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {format(new Date(notification.createdAt), 'MMM d, yyyy \'at\' HH:mm')}
                                </p>
                              </div>

                              {/* Read indicator */}
                              {!notification.read && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>

                            {/* Action Buttons for Relationship Requests */}
                            {notification.type === 'relationship_request' && (
                              <div className="flex space-x-2 mt-3">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleRelationshipResponse(notification, true)}
                                  disabled={isProcessing === notification.id}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600/30 text-green-300 rounded-lg hover:bg-green-600/40 transition-colors text-sm font-medium border border-green-500/40 disabled:opacity-50"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Accept</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleRelationshipResponse(notification, false)}
                                  disabled={isProcessing === notification.id}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-600/30 text-red-300 rounded-lg hover:bg-red-600/40 transition-colors text-sm font-medium border border-red-500/40 disabled:opacity-50"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Decline</span>
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-white/20">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Close notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}