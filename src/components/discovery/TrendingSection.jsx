// src/components/discovery/TrendingSection.jsx
import React from 'react';
import { TrendingUp } from 'lucide-react';
import CommunitySection from './CommunitySection';

const TrendingSection = ({ communities }) => {
  return (
    <CommunitySection
      title="🔥 Trending Communities"
      description="Most active communities this week"
      communities={communities}
      icon={TrendingUp}
    />
  );
};

export default TrendingSection; 