import React from 'react';

/**
 * Loading Spinner Component
 * A reusable loading indicator with different variants and sizes
 * 
 * @param {string} variant - The spinner variant ('default', 'dots', 'pulse', 'bars')
 * @param {string} size - The spinner size ('sm', 'md', 'lg', 'xl')
 * @param {string} color - The spinner color (Tailwind color classes)
 * @param {string} className - Additional CSS classes
 * @param {string} text - Optional loading text to display
 */
const LoadingSpinner = ({ 
  variant = 'default', 
  size = 'md', 
  color = 'text-blue-600', 
  className = '', 
  text = null 
}) => {
  // Size classes mapping
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Default spinner (circular)
  const DefaultSpinner = () => (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${color} ${className}`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Dots spinner
  const DotsSpinner = () => (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} ${color} rounded-full animate-pulse`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );

  // Pulse spinner
  const PulseSpinner = () => (
    <div className={`${sizeClasses[size]} ${color} ${className} animate-pulse rounded-full bg-current`} />
  );

  // Bars spinner
  const BarsSpinner = () => (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-1 ${sizeClasses[size].split(' ')[1]} ${color} bg-current animate-pulse`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  // Spinner component mapping
  const spinnerComponents = {
    default: DefaultSpinner,
    dots: DotsSpinner,
    pulse: PulseSpinner,
    bars: BarsSpinner
  };

  const SpinnerComponent = spinnerComponents[variant] || DefaultSpinner;

  return (
    <div className="flex flex-col items-center justify-center">
      <SpinnerComponent />
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

/**
 * Skeleton Loading Component
 * Shows placeholder content while data is loading
 */
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '', 
  height = 'h-4' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${height} bg-gray-200 rounded mb-2 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Card Skeleton Component
 * Shows a skeleton for card-like content
 */
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="animate-pulse">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
        
        {/* Footer skeleton */}
        <div className="flex justify-between items-center mt-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
};

/**
 * Table Skeleton Component
 * Shows a skeleton for table content
 */
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, index) => (
              <div
                key={index}
                className="h-4 bg-gray-200 rounded flex-1"
              />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-gray-200 rounded flex-1"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner; 