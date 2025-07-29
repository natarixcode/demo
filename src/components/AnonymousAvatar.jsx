// src/components/AnonymousAvatar.jsx
import React from 'react';

/**
 * Anonymous Avatar Component
 * Displays user initials in a colorful circular avatar
 * Maintains user anonymity while providing visual identity
 */
const AnonymousAvatar = ({ 
  initials, 
  color = '#3B82F6', 
  size = 'md',
  className = '' 
}) => {
  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };

  // Ensure we have initials (fallback to '??')
  const displayInitials = initials || '??';

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        flex items-center justify-center 
        font-bold text-white 
        shadow-lg 
        ring-2 ring-white/20
        transition-all duration-200
        hover:scale-105
        ${className}
      `}
      style={{ backgroundColor: color }}
      aria-label={`Avatar for user with initials ${displayInitials}`}
    >
      {displayInitials}
    </div>
  );
};

export default AnonymousAvatar; 