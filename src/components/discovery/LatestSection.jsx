// src/components/discovery/LatestSection.jsx
import React from 'react';
import { Clock } from 'lucide-react';
import CommunitySection from './CommunitySection';

const LatestSection = ({ communities }) => {
  return (
    <CommunitySection
      title="✨ Latest Communities"
      description="Recently created communities to explore"
      communities={communities}
      icon={Clock}
    />
  );
};

export default LatestSection; 