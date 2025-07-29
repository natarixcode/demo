// src/components/discovery/CommunityCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Calendar, TrendingUp, Activity } from 'lucide-react';

const CommunityCard = ({ 
  id, 
  name, 
  description, 
  member_count = 0, 
  post_count = 0,
  type, 
  pin_code, 
  last_active,
  distance,
  activity_score,
  created_at,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/communities/${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatDistance = (dist) => {
    if (!dist) return '';
    return `${Math.round(dist * 10) / 10} km`;
  };

  const getTypeColor = (communityType) => {
    return communityType === 'location_bound' ? 'text-green-600' : 'text-blue-600';
  };

  const getTypeIcon = (communityType) => {
    return communityType === 'location_bound' ? MapPin : Activity;
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`
        w-80 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 
        p-6 cursor-pointer transform transition-all duration-300 
        hover:scale-105 hover:shadow-xl hover:bg-white/80 
        active:scale-95 group ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 mb-1 truncate group-hover:text-blue-700 transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            {(() => {
              const TypeIcon = getTypeIcon(type);
              return <TypeIcon size={14} className={getTypeColor(type)} />;
            })()}
            <span className={`font-medium ${getTypeColor(type)}`}>
              {type === 'location_bound' ? (pin_code || 'Local') : 'Global'}
            </span>
            {distance && (
              <span className="text-gray-500">• {formatDistance(distance)}</span>
            )}
          </div>
        </div>
        
        {/* Activity indicator */}
        {activity_score && (
          <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
            <TrendingUp size={12} />
            <span>Hot</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
        {description || 'Join this amazing community and connect with like-minded people.'}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span className="font-medium">{member_count.toLocaleString()}</span>
            <span>members</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity size={14} />
            <span className="font-medium">{post_count}</span>
            <span>posts</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-200/50">
        {last_active && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Active {formatDate(last_active)}</span>
          </div>
        )}
        {created_at && !last_active && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Created {formatDate(created_at)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Join Community</span>
          <span>→</span>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default CommunityCard; 