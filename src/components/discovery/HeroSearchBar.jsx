// src/components/discovery/HeroSearchBar.jsx
import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

const HeroSearchBar = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Glass card background */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              {/* Search icon */}
              <div className="flex-shrink-0">
                <Search size={24} className="text-gray-500" />
              </div>

              {/* Search input */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Find communities by name, topic, or interest..."
                className="flex-1 text-lg bg-transparent border-none outline-none placeholder-gray-500 text-gray-900"
              />

              {/* Search button */}
              <button
                type="submit"
                className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={18} />
                  <span>Discover</span>
                </div>
              </button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-200/50 rounded-full blur-sm"></div>
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-200/50 rounded-full blur-sm"></div>
        </div>
      </form>

      {/* Quick suggestions */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {['Tech', 'Gaming', 'Art', 'Music', 'Sports', 'Food'].map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setQuery(tag);
              onSearch(tag);
            }}
            className="px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full text-sm text-gray-700 hover:bg-white/70 transition-all duration-200 border border-white/30"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroSearchBar; 