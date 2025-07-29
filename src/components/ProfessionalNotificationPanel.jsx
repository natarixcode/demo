// src/components/ProfessionalNotificationPanel.jsx
// International-Grade Professional Notification Panel

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Check, CheckAll, Trash2, Filter, Search, Settings, 
  MessageCircle, Heart, Users, Bell, AtSign, UserPlus,
  Calendar, Clock, Globe, Volume2, VolumeX, MoreHorizontal,
  ArrowRight, Star, Bookmark, Share2, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'react-toastify';
import AnonymousAvatar from './AnonymousAvatar';

/**
 * Professional Notification Panel with Advanced Features
 * - Real-time updates
 * - Advanced filtering and search
 * - Bulk operations
 * - International design
 * - Accessibility compliant
 * - Performance optimized
 */
const ProfessionalNotificationPanel = ({ 
  onClose, 
  onCountChange, 
  soundEnabled, 
  onSoundToggle 
}) => {
  const { user, getAuthHeader } = useAuth();
  const { t, i18n } = useTranslation();
  
  // State management
  const [notifications, setNotifications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'list'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  
  // Refs
  const scrollRef = useRef(null);
  const searchRef = useRef(null);
  const actionTimeoutRef = useRef(null);

  // Professional notification icons
  const getNotificationIcon = useCallback((type) => {
    const iconMap = {
      comment: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-100' },
      reply: { icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-100' },
      like: { icon: Heart, color: 'text-red-500', bg: 'bg-red-100' },
      join: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-100' },
      mention: { icon: AtSign, color: 'text-orange-500', bg: 'bg-orange-100' },
      follow: { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-100' },
      community_invite: { icon: Bell, color: 'text-pink-500', bg: 'bg-pink-100' }
    };
    return iconMap[type] || { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100' };
  }, []);

  // Fetch notifications with advanced options
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 50,
        ...(selectedFilter !== 'all' && { type: selectedFilter }),
        ...(selectedFilter === 'unread' && { unread: 'true' }),
        ...options.extraParams
      });

      const response = await fetch(`http://localhost:3001/api/notifications?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': i18n.language,
          'x-user-id': user.id.toString(),
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications || {});
        
        // Update parent count
        const totalUnread = Object.values(data.data.notifications || {})
          .flat()
          .filter(n => !n.is_read)
          .length;
        onCountChange?.(totalUnread);
      }

    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
      toast.error(t('notification.fetchError'), {
        className: 'professional-toast-error'
      });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeader, i18n.language, selectedFilter, onCountChange, t]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds = null, markAll = false) => {
    if (!user) return;

    try {
      setBulkActionLoading(true);

      const response = await fetch('http://localhost:3001/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': i18n.language,
          'x-user-id': user.id.toString(),
          ...getAuthHeader()
        },
        body: JSON.stringify({
          ...(markAll ? { markAll: true } : { notificationIds })
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(
          t('notification.markedRead', { count: data.data.markedCount }),
          { className: 'professional-toast-success' }
        );
        
        // Refresh notifications
        await fetchNotifications();
        setSelectedNotifications(new Set());
      }

    } catch (err) {
      console.error('Error marking as read:', err);
      toast.error(t('notification.markReadError'), {
        className: 'professional-toast-error'
      });
    } finally {
      setBulkActionLoading(false);
    }
  }, [user, getAuthHeader, i18n.language, t, fetchNotifications]);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }

    // Navigate to the notification target
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  }, [markAsRead]);

  // Filter and search notifications
  const filteredNotifications = useCallback(() => {
    let allNotifications = [];
    
    // Flatten all notifications
    Object.entries(notifications).forEach(([group, notifs]) => {
      if (Array.isArray(notifs)) {
        allNotifications.push(...notifs.map(n => ({ ...n, dateGroup: group })));
      }
    });

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      allNotifications = allNotifications.filter(n =>
        n.title.toLowerCase().includes(searchLower) ||
        n.content.toLowerCase().includes(searchLower) ||
        n.sender_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all' && selectedFilter !== 'unread') {
      allNotifications = allNotifications.filter(n => n.type === selectedFilter);
    }

    if (selectedFilter === 'unread') {
      allNotifications = allNotifications.filter(n => !n.is_read);
    }

    // Sort notifications
    allNotifications.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Re-group if needed
    if (viewMode === 'grouped') {
      const grouped = {};
      allNotifications.forEach(n => {
        if (!grouped[n.dateGroup]) grouped[n.dateGroup] = [];
        grouped[n.dateGroup].push(n);
      });
      return grouped;
    }

    return { all: allNotifications };
  }, [notifications, searchTerm, selectedFilter, sortOrder, viewMode]);

  // Initialize
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Focus search on Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Date group labels
  const getDateGroupLabel = useCallback((group) => {
    const labels = {
      today: t('notification.today'),
      yesterday: t('notification.yesterday'),
      thisWeek: t('notification.thisWeek'),
      earlier: t('notification.earlier'),
      all: t('notification.all')
    };
    return labels[group] || group;
  }, [t]);

  // Filter options
  const filterOptions = [
    { value: 'all', label: t('notification.filter.all'), icon: Bell },
    { value: 'unread', label: t('notification.filter.unread'), icon: Eye },
    { value: 'comment', label: t('notification.filter.comments'), icon: MessageCircle },
    { value: 'like', label: t('notification.filter.likes'), icon: Heart },
    { value: 'join', label: t('notification.filter.joins'), icon: Users },
    { value: 'mention', label: t('notification.filter.mentions'), icon: AtSign },
    { value: 'follow', label: t('notification.filter.follows'), icon: UserPlus }
  ];

  const filtered = filteredNotifications();
  const hasNotifications = Object.keys(filtered).length > 0 && 
                          Object.values(filtered).some(group => Array.isArray(group) && group.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-96 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
      style={{ maxHeight: '80vh' }}
    >
      {/* Professional Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bell size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('notification.title')}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Sound Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSoundToggle(!soundEnabled)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={soundEnabled ? t('notification.disableSound') : t('notification.enableSound')}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/settings/notifications'}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={t('notification.settings')}
            >
              <Settings size={16} />
            </motion.button>

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={t('notification.close')}
            >
              ×
            </motion.button>
          </div>
        </div>

        {/* Professional Search Bar */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder={t('notification.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Professional Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-4 overflow-x-auto">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFilter(option.value)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedFilter === option.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={14} />
                <span>{option.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-blue-50 rounded-xl p-3 mb-4"
          >
            <span className="text-sm text-blue-700">
              {t('notification.selectedCount', { count: selectedNotifications.size })}
            </span>
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => markAsRead(Array.from(selectedNotifications))}
                disabled={bulkActionLoading}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Check size={14} />
                <span>{t('notification.markRead')}</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => markAsRead(null, true)}
              disabled={bulkActionLoading}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckAll size={14} />
              <span>{t('notification.markAllRead')}</span>
            </motion.button>
          </div>

          <div className="flex space-x-2">
            {/* View Mode Toggle */}
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="grouped">{t('notification.viewGrouped')}</option>
              <option value="list">{t('notification.viewList')}</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">{t('notification.sortNewest')}</option>
              <option value="oldest">{t('notification.sortOldest')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Professional Content Area */}
      <div 
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: 'calc(80vh - 200px)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">{t('notification.loading')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-600 font-medium">{t('notification.error')}</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchNotifications()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('notification.retry')}
            </motion.button>
          </div>
        ) : !hasNotifications ? (
          <div className="p-8 text-center">
            <Bell size={48} className="text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? t('notification.noSearchResults') : t('notification.noNotifications')}
            </h4>
            <p className="text-gray-500">
              {searchTerm 
                ? t('notification.tryDifferentSearch')
                : t('notification.notificationsWillAppear')
              }
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {Object.entries(filtered).map(([group, notifs]) => {
              if (!Array.isArray(notifs) || notifs.length === 0) return null;

              return (
                <div key={group} className="space-y-2">
                  {viewMode === 'grouped' && group !== 'all' && (
                    <div className="flex items-center space-x-2 px-2">
                      <Calendar size={14} className="text-gray-400" />
                      <h5 className="text-sm font-medium text-gray-700">
                        {getDateGroupLabel(group)}
                      </h5>
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400">{notifs.length}</span>
                    </div>
                  )}

                  <AnimatePresence>
                    {notifs.map((notification, index) => {
                      const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
                      const isSelected = selectedNotifications.has(notification.id);

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer ${
                            notification.is_read
                              ? 'bg-white border-gray-200 hover:border-gray-300'
                              : 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                          } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSelected = new Set(selectedNotifications);
                              if (e.target.checked) {
                                newSelected.add(notification.id);
                              } else {
                                newSelected.delete(notification.id);
                              }
                              setSelectedNotifications(newSelected);
                            }}
                            className="absolute top-2 right-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          />

                          <div className="flex space-x-3">
                            {/* Professional Avatar or Icon */}
                            <div className="flex-shrink-0">
                              {notification.sender_id ? (
                                <AnonymousAvatar
                                  initials={notification.sender_initial}
                                  color={notification.sender_avatar_color}
                                  size="sm"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                                  <Icon size={16} className={color} />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Header */}
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
                                    {notification.time_ago}
                                  </span>
                                </div>
                              </div>

                              {/* Content */}
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {notification.content}
                              </p>

                              {/* Sender Info */}
                              {notification.sender_name && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <span>{t('notification.from')}</span>
                                  <span className="font-medium text-gray-700">
                                    {notification.sender_name}
                                  </span>
                                </div>
                              )}

                              {/* Action Indicator */}
                              {notification.action_url && (
                                <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ArrowRight size={14} className="text-blue-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Professional Footer */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 p-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {hasNotifications 
              ? t('notification.totalCount', { 
                  count: Object.values(filtered).flat().length 
                })
              : t('notification.noItems')
            }
          </span>
          <div className="flex items-center space-x-2">
            <Globe size={12} />
            <span>{i18n.language.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfessionalNotificationPanel; 