// src/components/LoadingSpinner.jsx
import React from 'react';

/**
 * Beautiful iOS 17-inspired Loading Spinner Component
 * Features:
 * - Multiple size variants (sm, md, lg, xl)
 * - Smooth iOS-style animations
 * - Glassmorphism background for overlay mode
 * - Optional text with elegant typography
 * - Customizable colors to match different contexts
 */
const LoadingSpinner = ({ 
  size = 'md', 
  text = '', 
  overlay = false, 
  color = 'blue',
  className = '',
  textClassName = ''
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      spinner: 'w-4 h-4',
      text: 'text-xs',
      container: 'space-y-2'
    },
    md: {
      spinner: 'w-6 h-6',
      text: 'text-sm',
      container: 'space-y-3'
    },
    lg: {
      spinner: 'w-8 h-8',
      text: 'text-base',
      container: 'space-y-4'
    },
    xl: {
      spinner: 'w-12 h-12',
      text: 'text-lg',
      container: 'space-y-4'
    }
  };

  // Color configurations
  const colorConfig = {
    blue: {
      spinner: 'border-iosBlue',
      text: 'text-iosBlue',
      glow: 'drop-shadow-[0_0_8px_rgba(0,122,255,0.3)]'
    },
    gray: {
      spinner: 'border-iosGray-600',
      text: 'text-iosGray-600',
      glow: 'drop-shadow-[0_0_8px_rgba(107,114,128,0.3)]'
    },
    green: {
      spinner: 'border-iosGreen',
      text: 'text-iosGreen',
      glow: 'drop-shadow-[0_0_8px_rgba(52,199,89,0.3)]'
    },
    purple: {
      spinner: 'border-iosPurple',
      text: 'text-iosPurple',
      glow: 'drop-shadow-[0_0_8px_rgba(175,82,222,0.3)]'
    },
    orange: {
      spinner: 'border-iosOrange',
      text: 'text-iosOrange',
      glow: 'drop-shadow-[0_0_8px_rgba(255,149,0,0.3)]'
    }
  };

  const sizeClasses = sizeConfig[size] || sizeConfig.md;
  const colorClasses = colorConfig[color] || colorConfig.blue;

  // Spinner component
  const SpinnerElement = () => (
    <div className="relative">
      {/* Main spinner */}
      <div 
        className={`
          ${sizeClasses.spinner} 
          ${colorClasses.spinner} 
          ${colorClasses.glow}
          border-2 border-current border-t-transparent 
          rounded-full animate-spin
          ${className}
        `}
      ></div>
      
      {/* Inner glow effect */}
      <div 
        className={`
          absolute inset-0
          ${sizeClasses.spinner} 
          ${colorClasses.spinner}
          border border-current border-t-transparent 
          rounded-full animate-spin opacity-50
        `}
        style={{
          animationDuration: '1.5s',
          animationDirection: 'reverse'
        }}
      ></div>
    </div>
  );

  // Content wrapper
  const ContentWrapper = ({ children }) => {
    if (overlay) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-ios-lg p-8 max-w-sm mx-4">
            {children}
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center ${sizeClasses.container}`}>
        {children}
      </div>
    );
  };

  return (
    <ContentWrapper>
      <SpinnerElement />
      
      {text && (
        <div className={`
          ${sizeClasses.text} 
          ${colorClasses.text} 
          font-medium text-center
          animate-pulse
          ${textClassName}
        `}>
          {text}
        </div>
      )}
    </ContentWrapper>
  );
};

// Predefined spinner variants for common use cases
export const LoadingOverlay = ({ text = 'Loading...' }) => (
  <LoadingSpinner 
    size="lg" 
    text={text} 
    overlay={true} 
    color="blue"
  />
);

export const SmallSpinner = ({ color = 'gray' }) => (
  <LoadingSpinner 
    size="sm" 
    color={color}
    className="inline-block"
  />
);

export const ButtonSpinner = ({ color = 'gray' }) => (
  <LoadingSpinner 
    size="sm" 
    color={color}
    className="inline-block mr-2"
  />
);

export const PageLoader = ({ text = 'Loading page...' }) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <LoadingSpinner 
      size="xl" 
      text={text} 
      color="blue"
    />
  </div>
);

export const InlineLoader = ({ text = 'Loading...', size = 'md', color = 'blue' }) => (
  <div className="flex items-center justify-center space-x-3 py-8">
    <LoadingSpinner 
      size={size} 
      color={color}
      className="flex-shrink-0"
    />
    {text && (
      <span className={`
        ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}
        font-medium 
        ${colorConfig[color]?.text || 'text-iosBlue'}
      `}>
        {text}
      </span>
    )}
  </div>
);

// iOS-style skeleton loader for content
export const SkeletonLoader = ({ 
  lines = 3, 
  avatar = false, 
  title = false,
  className = '' 
}) => (
  <div className={`animate-pulse ${className}`}>
    <div className="flex items-start space-x-3">
      {avatar && (
        <div className="w-10 h-10 bg-iosGray-200 rounded-full"></div>
      )}
      <div className="flex-1 space-y-3">
        {title && (
          <div className="h-4 bg-iosGray-200 rounded-xl w-1/3"></div>
        )}
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index}
            className={`h-3 bg-iosGray-200 rounded-xl ${
              index === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// Card skeleton for community/post cards
export const CardSkeleton = ({ className = '' }) => (
  <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 p-6 animate-pulse ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-5 bg-iosGray-200 rounded-xl w-2/3 mb-2"></div>
        <div className="h-3 bg-iosGray-200 rounded-xl w-full mb-1"></div>
        <div className="h-3 bg-iosGray-200 rounded-xl w-4/5"></div>
      </div>
      <div className="w-8 h-8 bg-iosGray-200 rounded-full"></div>
    </div>
    
    <div className="flex items-center space-x-4 mb-4">
      <div className="h-6 bg-iosGray-200 rounded-full w-20"></div>
      <div className="h-6 bg-iosGray-200 rounded-full w-16"></div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="h-8 bg-iosGray-200 rounded-xl w-20"></div>
      <div className="h-8 bg-iosGray-200 rounded-xl w-16"></div>
    </div>
  </div>
);

export default LoadingSpinner; 