// src/components/ProfessionalNotificationBell.jsx
// International-Grade Professional Notification Bell Component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Settings, MoreVertical, Check, CheckAll, Trash2, Filter, Search, Globe } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import ProfessionalNotificationPanel from './ProfessionalNotificationPanel';

/**
 * Professional Notification Bell with International Features
 * - Multi-language support
 * - Advanced animations
 * - Professional design system
 * - Accessibility compliant
 * - Real-time updates
 * - Performance optimized
 */
const ProfessionalNotificationBell = () => {
  const { user, getAuthHeader } = useAuth();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [networkStatus, setNetworkStatus] = useState('online');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const bellRef = useRef(null);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const animationRef = useRef(null);

  // Professional notification sound
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification-professional.mp3');
    audioRef.current.volume = 0.3;
  }, []);

  // Fetch unread count with error handling and retry logic
  const fetchUnreadCount = useCallback(async (retryCount = 0) => {
    if (!user || isLoading) return;

    try {
      setIsLoading(true);
      setNetworkStatus('connecting');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch('http://localhost:3001/api/notifications/unread-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': i18n.language,
          'x-user-id': user.id.toString(),
          ...getAuthHeader()
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newCount = data.data?.count || 0;

      // Animate count change
      if (newCount > unreadCount && unreadCount > 0) {
        triggerBellAnimation();
        if (soundEnabled) {
          playNotificationSound();
        }
        
        // Show toast for new notifications
        if (newCount - unreadCount > 0) {
          toast.info(
            t('notification.newCount', { count: newCount - unreadCount }),
            {
              position: 'top-right',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              className: 'professional-toast'
            }
          );
        }
      }

      setUnreadCount(newCount);
      setLastFetch(Date.now());
      setNetworkStatus('online');

    } catch (error) {
      console.error('Error fetching unread count:', error);
      setNetworkStatus('error');

      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => fetchUnreadCount(retryCount + 1), delay);
      } else {
        toast.error(
          t('notification.fetchError'),
          {
            position: 'top-right',
            autoClose: 5000,
            className: 'professional-toast-error'
          }
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, getAuthHeader, i18n.language, isLoading, unreadCount, soundEnabled, t]);

  // Real-time polling with adaptive intervals
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    // Adaptive polling: more frequent when user is active
    const getPollingInterval = () => {
      const timeSinceLastActivity = Date.now() - lastFetch;
      if (timeSinceLastActivity < 60000) return 15000; // 15s when active
      if (timeSinceLastActivity < 300000) return 30000; // 30s when less active
      return 60000; // 1m when idle
    };

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        fetchUnreadCount();
      }, getPollingInterval());
    };

    startPolling();

    // Activity detection
    const handleActivity = () => {
      setLastFetch(Date.now());
      startPolling(); // Restart with new interval
    };

    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
    };
  }, [user, fetchUnreadCount, lastFetch]);

  // Professional bell animation
  const triggerBellAnimation = useCallback(() => {
    if (animationRef.current) return; // Prevent overlapping animations

    const bell = bellRef.current;
    if (!bell) return;

    bell.style.transform = 'rotate(0deg)';
    
    const keyframes = [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-15deg)' },
      { transform: 'rotate(12deg)' },
      { transform: 'rotate(-10deg)' },
      { transform: 'rotate(8deg)' },
      { transform: 'rotate(-5deg)' },
      { transform: 'rotate(0deg)' }
    ];

    animationRef.current = bell.animate(keyframes, {
      duration: 600,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    });

    animationRef.current.addEventListener('finish', () => {
      animationRef.current = null;
    });
  }, []);

  // Professional notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.warn);
    }
  }, [soundEnabled]);

  // Handle bell click
  const handleBellClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
    
    // Haptic feedback on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  if (!user) return null;

  return (
    <div className="relative" ref={bellRef}>
      {/* Professional Bell Button */}
      <motion.button
        onClick={handleBellClick}
        className="relative group p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('notification.bellAriaLabel', { count: unreadCount })}
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="notification-bell"
      >
        {/* Network Status Indicator */}
        <div className={`absolute -top-1 -left-1 w-2 h-2 rounded-full transition-colors duration-300 ${
          networkStatus === 'online' ? 'bg-green-400' :
          networkStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
          'bg-red-400'
        }`} />

        {/* Bell Icon with Professional Styling */}
        <div className="relative">
          <Bell 
            size={20} 
            className={`text-gray-700 group-hover:text-blue-600 transition-colors duration-300 ${
              isLoading ? 'animate-pulse' : ''
            }`}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Professional Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30 
              }}
              className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg ring-2 ring-white/30"
              data-testid="unread-badge"
            >
              <motion.span
                key={unreadCount}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Animation for New Notifications */}
        {unreadCount > 0 && (
          <div className="absolute inset-0 rounded-xl bg-blue-400/20 animate-ping" />
        )}
      </motion.button>

      {/* Professional Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
            className="absolute right-0 top-full mt-2 z-50"
            style={{ filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))' }}
          >
            <ProfessionalNotificationPanel
              onClose={() => setIsOpen(false)}
              onCountChange={setUnreadCount}
              soundEnabled={soundEnabled}
              onSoundToggle={setSoundEnabled}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Tooltip */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute right-0 top-full mt-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-40"
          >
            {unreadCount > 0 
              ? t('notification.unreadTooltip', { count: unreadCount })
              : t('notification.noUnreadTooltip')
            }
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfessionalNotificationBell; 