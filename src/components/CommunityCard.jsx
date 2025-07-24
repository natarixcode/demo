// src/components/CommunityCard.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

/**
 * Beautiful iOS 17-inspired Community Card Component
 * Features:
 * - Glassmorphism design with smooth animations
 * - Location-based features with distance calculation
 * - Join/Leave functionality with smooth state changes
 * - Member count and activity indicators
 * - Hover effects and interactive elements
 */
const CommunityCard = ({ community, userLocation, onJoinStatusChange }) => {
  const { user, isAuthenticated, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [memberCount, setMemberCount] = useState(community.member_count || 0);
  const [isJoined, setIsJoined] = useState(community.is_member || false);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate distance if user location is available and community is location-bound
  const calculateDistance = () => {
    if (!userLocation || !community.latitude || !community.longitude) {
      return null;
    }

    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (community.latitude - userLocation.lat) * Math.PI / 180;
    const dLon = (community.longitude - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(community.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km away`;
    } else {
      return `${Math.round(distance)}km away`;
    }
  };

  // Handle join/leave community
  const handleJoinToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to join communities');
      navigate('/login');
      return;
    }

    if (isJoining) return; // Prevent double-clicking

    setIsJoining(true);
    const action = isJoined ? 'leave' : 'join';

    try {
      const response = await fetch(`http://localhost:3001/api/communities/${community.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          user_id: user.id
        })
      });

      if (response.ok) {
        const newJoinedState = !isJoined;
        setIsJoined(newJoinedState);
        setMemberCount(prev => newJoinedState ? prev + 1 : Math.max(0, prev - 1));
        
        toast.success(newJoinedState ? 
          `🎉 Welcome to ${community.name}!` : 
          `👋 Left ${community.name}`
        );
        
        // Notify parent component
        if (onJoinStatusChange) {
          onJoinStatusChange(community.id, newJoinedState ? 'joined' : 'left');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to ${action} community`);
      }
    } catch (error) {
      console.error(`Error ${action}ing community:`, error);
      toast.error(`Network error while trying to ${action} community`);
    } finally {
      setIsJoining(false);
    }
  };

  // Get community type styling
  const getTypeInfo = () => {
    if (community.type === 'location_bound') {
      return {
        icon: '📍',
        label: 'Location-Based',
        bgColor: 'from-iosGreen/10 to-iosTeal/10',
        textColor: 'text-iosGreen',
        borderColor: 'border-iosGreen/20'
      };
    } else {
      return {
        icon: '🌐',
        label: 'Global',
        bgColor: 'from-iosBlue/10 to-iosPurple/10',
        textColor: 'text-iosBlue',
        borderColor: 'border-iosBlue/20'
      };
    }
  };

  // Get member count display
  const getMemberCountDisplay = () => {
    if (memberCount >= 1000000) {
      return `${(memberCount / 1000000).toFixed(1)}M`;
    } else if (memberCount >= 1000) {
      return `${(memberCount / 1000).toFixed(1)}K`;
    } else {
      return memberCount.toString();
    }
  };

  const typeInfo = getTypeInfo();
  const distance = calculateDistance();
  const postCount = community.post_count || 0;

  return (
    <div
      className={`group relative bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm hover:shadow-ios-lg transition-all duration-300 overflow-hidden ${
        isHovered ? 'scale-[1.02]' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50"></div>

      {/* Header */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* Community Name */}
            <Link
              to={`/communities/${community.id}`}
              className="group/link"
            >
              <h3 className="text-xl font-bold text-iosGray-900 mb-2 group-hover/link:text-iosBlue transition-colors duration-200 line-clamp-1">
                {community.name}
              </h3>
            </Link>

            {/* Description */}
            <p className="text-iosGray-600 text-sm line-clamp-2 mb-3 leading-relaxed">
              {community.description || 'A wonderful community to connect and share.'}
            </p>

            {/* Type Badge */}
            <div className={`inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r ${typeInfo.bgColor} border ${typeInfo.borderColor} rounded-full`}>
              <span className="text-sm">{typeInfo.icon}</span>
              <span className={`text-xs font-medium ${typeInfo.textColor}`}>
                {typeInfo.label}
              </span>
            </div>
          </div>

          {/* Join Status Indicator */}
          {isJoined && (
            <div className="flex-shrink-0 ml-3">
              <div className="w-8 h-8 bg-gradient-to-br from-iosGreen to-iosTeal rounded-full flex items-center justify-center shadow-ios">
                <span className="text-white text-sm">✓</span>
              </div>
            </div>
          )}
        </div>

        {/* Location Info */}
        {community.type === 'location_bound' && (
          <div className="flex items-center space-x-4 text-xs text-iosGray-500 mb-4">
            <div className="flex items-center space-x-1">
              <span>📍</span>
              <span className="truncate">
                {community.location || 'Location-based community'}
              </span>
            </div>
            {distance && (
              <div className="flex items-center space-x-1">
                <span>📏</span>
                <span className="text-iosBlue font-medium">{distance}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {/* Members */}
            <div className="flex items-center space-x-1 text-iosGray-600">
              <span>👥</span>
              <span className="font-medium">{getMemberCountDisplay()}</span>
              <span className="hidden sm:inline">members</span>
            </div>

            {/* Posts */}
            <div className="flex items-center space-x-1 text-iosGray-600">
              <span>📝</span>
              <span className="font-medium">{postCount}</span>
              <span className="hidden sm:inline">posts</span>
            </div>

            {/* Activity Indicator */}
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-iosGreen rounded-full animate-pulse"></div>
              <span className="text-xs text-iosGreen font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="relative p-6 pt-0">
        <div className="flex items-center justify-between">
          {/* View Community Link */}
          <Link
            to={`/communities/${community.id}`}
            className="flex items-center space-x-2 px-4 py-2 bg-white/40 backdrop-blur-md text-iosGray-700 rounded-xl font-medium hover:bg-white/60 transition-all duration-200 border border-white/30"
          >
            <span>👀</span>
            <span>View</span>
          </Link>

          {/* Join/Leave Button */}
          <button
            onClick={handleJoinToggle}
            disabled={isJoining}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-ios disabled:opacity-50 disabled:cursor-not-allowed ${
              isJoined
                ? 'bg-iosGray-200 text-iosGray-700 hover:bg-iosGray-300'
                : 'bg-iosBlue text-white hover:bg-iosBlue/90'
            }`}
          >
            {isJoining ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>...</span>
              </>
            ) : isJoined ? (
              <>
                <span>✓</span>
                <span>Joined</span>
              </>
            ) : (
              <>
                <span>+</span>
                <span>Join</span>
              </>
            )}
          </button>
        </div>

        {/* Additional Actions */}
        {isJoined && (
          <div className="flex items-center justify-center mt-3 pt-3 border-t border-white/20">
            <Link
              to={`/communities/${community.id}/create-post`}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-iosBlue/10 to-iosPurple/10 text-iosBlue rounded-lg text-sm font-medium hover:from-iosBlue/20 hover:to-iosPurple/20 transition-all duration-200"
            >
              <span>✍️</span>
              <span>Create Post</span>
            </Link>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-iosBlue/5 to-iosPurple/5 rounded-2xl transition-opacity duration-300 pointer-events-none ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}></div>
    </div>
  );
};

export default CommunityCard; 