// src/components/discovery/CommunitySection.jsx
import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CommunityCard from './CommunityCard';

const CommunitySection = ({ 
  title, 
  communities = [], 
  icon: Icon,
  description,
  showScrollButtons = true,
  className = ''
}) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Width of one card plus gap
      const currentScroll = scrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  if (!communities || communities.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl">
              <Icon size={24} className="text-blue-600" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-600 text-sm mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Scroll buttons - only show on desktop */}
        {showScrollButtons && communities.length > 3 && (
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/80 transition-all duration-200 shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/80 transition-all duration-200 shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Communities Container */}
      <div className="relative">
        {/* Desktop: Horizontal scroll */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
        >
          {communities.map((community, index) => (
            <div key={community.id} className="flex-shrink-0">
              <CommunityCard 
                {...community}
                className={`
                  ${index === 0 ? 'ml-0' : ''}
                  ${index === communities.length - 1 ? 'mr-4' : ''}
                `}
              />
            </div>
          ))}
        </div>

        {/* Fade effects for scroll indication */}
        <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-blue-50 to-transparent pointer-events-none opacity-50 md:opacity-100" />
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-blue-50 to-transparent pointer-events-none opacity-50 md:opacity-100" />
      </div>

      {/* Mobile: Show count indicator */}
      <div className="md:hidden text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full text-sm text-gray-600">
          <span>{communities.length} communities</span>
          <span>•</span>
          <span>Swipe to explore →</span>
        </div>
      </div>
    </div>
  );
};

export default CommunitySection; 