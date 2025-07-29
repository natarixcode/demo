// src/components/discovery/NearbySection.jsx
import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import CommunitySection from './CommunitySection';

const NearbySection = ({ communities, userLocation, onRadiusChange }) => {
  const [radius, setRadius] = useState(10);

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  return (
    <div className="space-y-4">
      {/* Radius Control */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation size={18} className="text-green-600" />
            <span className="font-medium text-gray-900">Search Radius</span>
          </div>
          <span className="text-sm font-semibold text-green-600">{radius} km</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">1km</span>
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${(radius/50)*100}%, #e5e7eb ${(radius/50)*100}%, #e5e7eb 100%)`
            }}
          />
          <span className="text-sm text-gray-500">50km</span>
        </div>
      </div>

      {/* Communities */}
      <CommunitySection
        title="📍 Nearby Communities"
        description={`Communities within ${radius}km of your location`}
        communities={communities}
        icon={MapPin}
      />
    </div>
  );
};

export default NearbySection; 