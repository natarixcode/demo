// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';

/**
 * Notification Bell Component
 * Shows a bell icon with unread count badge and handles panel toggle
 */
const NotificationBell = () => {
  const { user, getAuthHeader } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/notifications/unread-count', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(), // Temporary fallback
          ...getAuthHeader()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const newCount = data.data.count;
        
        // Animate if count increased
        if (newCount > unreadCount) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 600);
        }
        
        setUnreadCount(newCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch count on mount and set up polling
  useEffect(() => {
    if (!user) return;
    
    fetchUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Handle clicks outside to close panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        bellRef.current && 
        !bellRef.current.contains(event.target) &&
        panelRef.current && 
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle bell click
  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  // Handle notification read (to update count)
  const handleNotificationRead = (readCount = 1) => {
    setUnreadCount(prev => Math.max(0, prev - readCount));
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    setUnreadCount(0);
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className={`
          relative p-2 rounded-full transition-all duration-200 
          ${isOpen 
            ? 'bg-blue-100 text-blue-600' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${isAnimating ? 'animate-bounce' : ''}
        `}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {/* Bell SVG Icon */}
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span 
            className={`
              absolute -top-1 -right-1 
              bg-red-500 text-white text-xs 
              w-5 h-5 rounded-full 
              flex items-center justify-center 
              font-medium shadow-lg
              transition-all duration-300
              ${isAnimating ? 'animate-pulse scale-125' : ''}
            `}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Ring Animation for New Notifications */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75"></div>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div ref={panelRef}>
          <NotificationPanel 
            onClose={() => setIsOpen(false)}
            onNotificationRead={handleNotificationRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            unreadCount={unreadCount}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 