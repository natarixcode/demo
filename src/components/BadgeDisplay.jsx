import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const BadgeIcon = ({ badge, size = 'md', showTooltip = true }) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };
  
  const tooltipSizeClasses = {
    sm: 'text-xs w-40',
    md: 'text-sm w-48',
    lg: 'text-base w-56',
    xl: 'text-lg w-64'
  };

  // Fallback to emoji if no icon_url
  const getIconDisplay = () => {
    if (badge.icon_url && badge.icon_url !== '/badges/placeholder.svg') {
      return (
        <img 
          src={badge.icon_url} 
          alt={badge.name}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    // Extract emoji from badge name or use default
    const emoji = badge.name.match(/^[^\w\s]/)?.[0] || '🏆';
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg text-${size === 'sm' ? 'sm' : size === 'lg' ? '2xl' : size === 'xl' ? '3xl' : 'lg'}`}>
        {emoji}
      </div>
    );
  };

  return (
    <div className="relative group">
      <div 
        className="cursor-pointer"
        onMouseEnter={() => showTooltip && setShowTooltipState(true)}
        onMouseLeave={() => setShowTooltipState(false)}
      >
        {getIconDisplay()}
        {/* Fallback emoji display */}
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg hidden`}>
          🏆
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <div className={`absolute z-50 ${tooltipSizeClasses[size]} bg-white rounded-xl shadow-xl border border-gray-100 p-3 -top-2 left-full ml-2 transform transition-all duration-200`}>
          <div className="absolute -left-1 top-4 w-2 h-2 bg-white border-l border-t border-gray-100 rotate-45"></div>
          <div className="font-semibold text-gray-900 mb-1">{badge.name}</div>
          <div className="text-gray-600 mb-2">{badge.description}</div>
          {badge.awarded_at && (
            <div className="text-xs text-gray-400">
              Earned: {new Date(badge.awarded_at).toLocaleDateString()}
            </div>
          )}
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
            badge.badge_type === 'milestone' ? 'bg-blue-100 text-blue-700' :
            badge.badge_type === 'behavior' ? 'bg-green-100 text-green-700' :
            badge.badge_type === 'community' ? 'bg-purple-100 text-purple-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {badge.badge_type}
          </div>
        </div>
      )}
    </div>
  );
};

const BadgeGrid = ({ badges, maxDisplay = null, size = 'md' }) => {
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remainingCount = maxDisplay && badges.length > maxDisplay ? badges.length - maxDisplay : 0;

  if (!badges || badges.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        No badges earned yet
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayBadges.map((badge) => (
        <BadgeIcon 
          key={badge.id} 
          badge={badge} 
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <div className={`${size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-16 h-16 text-lg' : 'w-10 h-10 text-sm'} rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium shadow-md`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

const BadgeSection = ({ userId, title = "Badges", showStats = false }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { get } = useApi();

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const response = await get(`/api/users/${userId}/badges`);
        if (response.success) {
          setBadges(response.data);
        }
        
        if (showStats) {
          const statsResponse = await get('/badges/stats');
          if (statsResponse.success) {
            setStats(statsResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBadges();
    }
  }, [userId, showStats, get]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-20 mb-3"></div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-10 h-10 bg-gray-200 rounded-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-500">
          {badges.length} badge{badges.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <BadgeGrid badges={badges} size="md" />
      
      {badges.length === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏆</div>
          <div className="text-gray-500 mb-2">No badges yet</div>
          <div className="text-sm text-gray-400">
            Start participating to earn your first badge!
          </div>
        </div>
      )}
      
      {showStats && stats && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="font-medium text-gray-900 mb-3">Badge Leaderboard</h4>
          <div className="space-y-2">
            {stats.topUsers.slice(0, 5).map((user, index) => (
              <div key={user.username} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium">{user.username}</span>
                </div>
                <div className="text-gray-500">
                  {user.badge_count} badges • {user.karma} karma
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Mini badge display for comments and user cards
const BadgeMini = ({ badges, maxDisplay = 3 }) => {
  if (!badges || badges.length === 0) return null;
  
  return (
    <div className="flex -space-x-1">
      {badges.slice(0, maxDisplay).map((badge) => (
        <BadgeIcon 
          key={badge.id} 
          badge={badge} 
          size="sm"
          showTooltip={true}
        />
      ))}
    </div>
  );
};

export { BadgeIcon, BadgeGrid, BadgeSection, BadgeMini };
export default BadgeSection; 