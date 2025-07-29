// src/components/SimpleNotificationBell.jsx
// Simple Professional Notification Bell (Fallback)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Settings, X, Check, CheckCheck, Search, Calendar, Clock, MessageCircle, Heart, Users, AtSign } from 'lucide-react';
import AnonymousAvatar from './AnonymousAvatar';

const SimpleNotificationBell = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const bellRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('http://localhost:3001/api/notifications/unread-count', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newCount = data.data?.count || data.count || 0;
        setUnreadCount(newCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: 50,
        ...(selectedFilter !== 'all' && selectedFilter !== 'unread' && { type: selectedFilter }),
        ...(selectedFilter === 'unread' && { unread: 'true' })
      });

      const response = await fetch(`http://localhost:3001/api/notifications?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data?.notifications || data.notifications || {});
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedFilter]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds = null, markAll = false) => {
    if (!user) return;

    try {
      const response = await fetch('http://localhost:3001/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
        },
        body: JSON.stringify({
          ...(markAll ? { markAll: true } : { notificationIds })
        })
      });

      if (response.ok) {
        await fetchNotifications();
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Get notification icon
  const getNotificationIcon = (type) => {
    const iconMap = {
      comment: MessageCircle,
      reply: MessageCircle,
      like: Heart,
      join: Users,
      mention: AtSign,
    };
    return iconMap[type] || Bell;
  };

  // Initialize
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter notifications
  const filteredNotifications = () => {
    let allNotifications = [];
    
    Object.entries(notifications).forEach(([group, notifs]) => {
      if (Array.isArray(notifs)) {
        allNotifications.push(...notifs.map(n => ({ ...n, dateGroup: group })));
      }
    });

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      allNotifications = allNotifications.filter(n =>
        n.title?.toLowerCase().includes(searchLower) ||
        n.content?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedFilter === 'unread') {
      allNotifications = allNotifications.filter(n => !n.is_read);
    } else if (selectedFilter !== 'all') {
      allNotifications = allNotifications.filter(n => n.type === selectedFilter);
    }

    // Group back
    const grouped = {};
    allNotifications.forEach(n => {
      if (!grouped[n.dateGroup]) grouped[n.dateGroup] = [];
      grouped[n.dateGroup].push(n);
    });

    return grouped;
  };

  if (!user) return null;

  const filtered = filteredNotifications();
  const hasNotifications = Object.keys(filtered).length > 0 && 
                          Object.values(filtered).some(group => Array.isArray(group) && group.length > 0);

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        aria-label={`Notifications - ${unreadCount} unread`}
      >
        <Bell size={20} className="text-gray-700 group-hover:text-blue-600 transition-colors duration-300" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg ring-2 ring-white/30 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bell size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.location.href = '/settings/notifications'}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Notification Settings"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-4 overflow-x-auto">
              {[
                { value: 'all', label: 'All', icon: Bell },
                { value: 'unread', label: 'Unread', icon: Bell },
                { value: 'comment', label: 'Comments', icon: MessageCircle },
                { value: 'like', label: 'Likes', icon: Heart },
                { value: 'join', label: 'Joins', icon: Users },
                { value: 'mention', label: 'Mentions', icon: AtSign }
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFilter(option.value)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      selectedFilter === option.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => markAsRead(null, true)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !hasNotifications ? (
              <div className="p-8 text-center">
                <Bell size={48} className="text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No notifications found' : 'No notifications yet'}
                </h4>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Try searching for something else'
                    : 'When you get notifications, they\'ll appear here'
                  }
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {Object.entries(filtered).map(([group, notifs]) => {
                  if (!Array.isArray(notifs) || notifs.length === 0) return null;

                  const groupLabels = {
                    today: 'Today',
                    yesterday: 'Yesterday',
                    thisWeek: 'This Week',
                    earlier: 'Earlier'
                  };

                  return (
                    <div key={group} className="space-y-2">
                      <div className="flex items-center space-x-2 px-2">
                        <Calendar size={14} className="text-gray-400" />
                        <h5 className="text-sm font-medium text-gray-700">
                          {groupLabels[group] || group}
                        </h5>
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400">{notifs.length}</span>
                      </div>

                      {notifs.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        
                        return (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer ${
                              notification.is_read
                                ? 'bg-white border-gray-200 hover:border-gray-300'
                                : 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                            }`}
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead([notification.id]);
                              }
                              if (notification.action_url) {
                                window.location.href = notification.action_url;
                              }
                            }}
                          >
                            <div className="flex space-x-3">
                              <div className="flex-shrink-0">
                                {notification.sender_id ? (
                                  <AnonymousAvatar
                                    initials={notification.sender_initial || notification.sender_name?.charAt(0) || '?'}
                                    color={notification.sender_avatar_color || '#3B82F6'}
                                    size="sm"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Icon size={16} className="text-blue-500" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {notification.title}
                                  </p>
                                  <div className="flex items-center space-x-1 ml-2">
                                    {!notification.is_read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                    <Clock size={12} className="text-gray-400" />
                                    <span className="text-xs text-gray-400">
                                      {notification.time_ago || 'just now'}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-2">
                                  {notification.content}
                                </p>

                                {notification.sender_name && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <span>from</span>
                                    <span className="font-medium text-gray-700">
                                      {notification.sender_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 p-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {hasNotifications 
                  ? `${Object.values(filtered).flat().length} notifications`
                  : 'No items'
                }
              </span>
              <span>NATARIX</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleNotificationBell; 