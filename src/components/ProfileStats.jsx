// src/components/ProfileStats.jsx
import React from 'react';

/**
 * Profile Statistics Component
 * Displays user karma, post count, and comment count in a beautiful card layout
 */
const ProfileStats = ({ karma = 0, postCount = 0, commentCount = 0 }) => {
  const stats = [
    {
      label: 'Karma',
      value: karma,
      icon: '⭐',
      color: 'from-yellow-400 to-orange-500',
      textColor: 'text-yellow-600'
    },
    {
      label: 'Posts',
      value: postCount,
      icon: '📝',
      color: 'from-blue-400 to-blue-600',
      textColor: 'text-blue-600'
    },
    {
      label: 'Comments',
      value: commentCount,
      icon: '💬',
      color: 'from-green-400 to-emerald-500',
      textColor: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="relative group"
        >
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
            {/* Gradient background overlay */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
            
            {/* Content */}
            <div className="relative z-10 text-center">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                {stat.value.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>

            {/* Subtle animation dots */}
            <div className="absolute top-2 right-2 opacity-20">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats; 