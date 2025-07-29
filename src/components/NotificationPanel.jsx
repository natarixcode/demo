// src/components/NotificationPanel.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnonymousAvatar from './AnonymousAvatar';
import { toast } from 'react-toastify';

/**
 * Notification Panel Component
 * Displays grouped notifications with beautiful iOS 17 glassmorphism design
 */
const NotificationPanel = ({ onClose, onNotificationRead, onMarkAllAsRead, unreadCount }) => {
  const { user, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({});
  const [loading, setLoading] = useState(true);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/notifications?limit=50', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(), // Temporary fallback
          ...getAuthHeader()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.is_read) {
        await fetch('http://localhost:3001/api/notifications/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id.toString(),
            ...getAuthHeader()
          },
          body: JSON.stringify({ notificationIds: [notification.id] })
        });

        // Update local state
        setNotifications(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(group => {
            updated[group] = updated[group].map(n => 
              n.id === notification.id ? { ...n, is_read: true } : n
            );
          });
          return updated;
        });

        onNotificationRead(1);
      }

      // Navigate to action URL
      if (notification.action_url) {
        navigate(notification.action_url);
        onClose();
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setMarkingAllAsRead(true);
      
      const response = await fetch('http://localhost:3001/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
          ...getAuthHeader()
        },
        body: JSON.stringify({}) // Empty body means mark all as read
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(group => {
            updated[group] = updated[group].map(n => ({ ...n, is_read: true }));
          });
          return updated;
        });

        onMarkAllAsRead();
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      comment: '💬',
      reply: '💭',
      join: '👋',
      like: '⭐',
      mention: '@️⃣',
      follow: '👤',
      community_invite: '📨'
    };
    return icons[type] || '🔔';
  };

  // Empty state
  const isEmpty = Object.keys(notifications).length === 0;

  return (
    <div className="absolute top-full right-0 mt-2 w-96 max-w-screen z-50">
      {/* Panel Container with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            
            <div className="flex items-center gap-2">
              {/* Mark All as Read Button */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {markingAllAsRead ? 'Marking...' : 'Mark all read'}
                </button>
              )}
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            // Loading State
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : isEmpty ? (
            // Empty State
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🔔</div>
              <h4 className="font-medium text-gray-900 mb-2">You're all caught up!</h4>
              <p className="text-gray-600 text-sm">No new notifications right now.</p>
            </div>
          ) : (
            // Notifications List
            <div className="divide-y divide-gray-100">
              {Object.entries(notifications).map(([group, groupNotifications]) => (
                <div key={group}>
                  {/* Group Header */}
                  <div className="px-4 py-2 bg-gray-50/50">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {group}
                    </h4>
                  </div>
                  
                  {/* Group Notifications */}
                  {groupNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        p-4 cursor-pointer transition-all duration-200 hover:bg-blue-50/50
                        ${!notification.is_read ? 'bg-blue-50/30 border-l-4 border-l-blue-500' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Sender Avatar or Icon */}
                        {notification.sender_username ? (
                          <AnonymousAvatar
                            initials={notification.sender_avatar_initials}
                            color={notification.sender_avatar_color}
                            size="sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          
                          {/* Content */}
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                          
                          {/* Time */}
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="p-3 border-t border-gray-200/50 bg-gray-50/30">
            <button
              onClick={() => {
                navigate('/settings/notifications');
                onClose();
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ⚙️ Notification Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel; 