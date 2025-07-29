// src/pages/Discovery.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import HeroSearchBar from '../components/discovery/HeroSearchBar';
import TrendingSection from '../components/discovery/TrendingSection';
import NearbySection from '../components/discovery/NearbySection';
import PopularSection from '../components/discovery/PopularSection';
import LatestSection from '../components/discovery/LatestSection';
import SearchResults from '../components/discovery/SearchResults';
import LoadingSpinner from '../components/LoadingSpinner';

const Discovery = () => {
  const [discoveryData, setDiscoveryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get('q');

  // Get user location for nearby communities
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
          // Continue without location - nearby section will be hidden
        }
      );
    }
  }, []);

  // Fetch discovery data
  useEffect(() => {
    fetchDiscoveryData();
  }, [userLocation, searchQuery]);

  const fetchDiscoveryData = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = 'http://localhost:3001/api/communities/discovery';
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append('search', searchQuery);
      } else {
        // Add location for nearby if available
        if (userLocation) {
          params.append('lat', userLocation.lat);
          params.append('lng', userLocation.lng);
        }
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDiscoveryData(data);

    } catch (err) {
      console.error('Error fetching discovery data:', err);
      setError(err.message);
      toast.error('Failed to load communities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/discovery?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/discovery');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load communities</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDiscoveryData}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="discovery-container max-w-screen-xl mx-auto p-4 space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Discover <span className="text-gradient">Communities</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Find amazing communities around you or explore trending topics that match your interests
          </p>
          <HeroSearchBar onSearch={handleSearch} initialQuery={searchQuery || ''} />
        </div>

        {/* Search Results */}
        {searchQuery && discoveryData?.search && (
          <SearchResults 
            results={discoveryData.search} 
            searchQuery={searchQuery}
            onClearSearch={() => navigate('/discovery')}
          />
        )}

        {/* Discovery Sections */}
        {!searchQuery && discoveryData && (
          <div className="space-y-12">
            {/* Trending Section */}
            {discoveryData.trending && discoveryData.trending.length > 0 && (
              <TrendingSection communities={discoveryData.trending} />
            )}

            {/* Nearby Section */}
            {userLocation && discoveryData.nearby && discoveryData.nearby.length > 0 && (
              <NearbySection 
                communities={discoveryData.nearby} 
                userLocation={userLocation}
                onRadiusChange={(radius) => {
                  // Re-fetch with new radius
                  // Implementation for radius filter can be added here
                }}
              />
            )}

            {/* Popular Section */}
            {discoveryData.popular && discoveryData.popular.length > 0 && (
              <PopularSection communities={discoveryData.popular} />
            )}

            {/* Latest Section */}
            {discoveryData.latest && discoveryData.latest.length > 0 && (
              <LatestSection communities={discoveryData.latest} />
            )}

            {/* Statistics */}
            {discoveryData.totalCounts && (
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{discoveryData.totalCounts.total}</div>
                    <div className="text-gray-600">Total Communities</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">{discoveryData.totalCounts.trending}</div>
                    <div className="text-gray-600">Active This Week</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">{discoveryData.totalCounts.locationBound}</div>
                    <div className="text-gray-600">Location-Based</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && discoveryData && 
         (!discoveryData.trending?.length && !discoveryData.popular?.length && !discoveryData.latest?.length) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏘️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No communities found</h3>
            <p className="text-gray-600">Be the first to create a community!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery; 