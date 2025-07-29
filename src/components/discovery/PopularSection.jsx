// src/components/discovery/PopularSection.jsx
import React from 'react';
import { Crown } from 'lucide-react';
import CommunitySection from './CommunitySection';

const PopularSection = ({ communities }) => {
  return (
    <CommunitySection
      title="👑 Popular Communities"
      description="Communities with the most members"
      communities={communities}
      icon={Crown}
    />
  );
};

export default PopularSection; 