// src/components/discovery/SearchResults.jsx
import React from 'react';
import { Search, X } from 'lucide-react';
import CommunityCard from './CommunityCard';

const SearchResults = ({ results, searchQuery, onClearSearch }) => {
  if (!results || results.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No communities found for "{searchQuery}"
        </h3>
        <p className="text-gray-600 mb-4">
          Try adjusting your search terms or explore our trending communities instead.
        </p>
        <button
          onClick={onClearSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Explore All Communities
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Search size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results for "{searchQuery}"
              </h2>
              <p className="text-gray-600 text-sm">
                Found {results.length} {results.length === 1 ? 'community' : 'communities'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClearSearch}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Clear search"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((community) => (
          <CommunityCard key={community.id} {...community} />
        ))}
      </div>

      {/* Results Footer */}
      <div className="text-center">
        <button
          onClick={onClearSearch}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/70 transition-all duration-200 text-gray-700"
        >
          <Search size={18} />
          <span>Explore All Communities</span>
        </button>
      </div>
    </div>
  );
};

export default SearchResults; 