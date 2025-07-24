// src/pages/Communities.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import CommunityCard from '../components/CommunityCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Communities = () => {
  const { user, getAuthHeader } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'All Communities', icon: '🌍' },
    { id: 'location_bound', label: 'Location-Based', icon: '📍' },
    { id: 'agnostic', label: 'Global', icon: '🌐' },
    { id: 'joined', label: 'My Communities', icon: '⭐' }
  ];

  // Sort options
  const sortOptions = [
    { id: 'newest', label: 'Newest First' },
    { id: 'members', label: 'Most Members' },
    { id: 'name', label: 'Alphabetical' },
    { id: 'activity', label: 'Most Active' }
  ];

  // Fetch all communities
  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:3001/api/communities', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch communities: ${response.status}`);
      }

      const data = await response.json();
      console.log('Communities API response:', data);
      
      // Handle different response formats
      if (data.success && Array.isArray(data.data)) {
        setCommunities(data.data);
      } else if (Array.isArray(data)) {
        setCommunities(data);
      } else if (data.communities && Array.isArray(data.communities)) {
        setCommunities(data.communities);
      } else {
        console.error('Communities data format unexpected:', data);
        setCommunities([]);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Failed to load communities. Please try again.');
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's joined communities
  const fetchJoinedCommunities = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:3001/api/communities/my`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User communities response:', data);
        
        // Handle different response formats
        let communities = [];
        if (data.success && Array.isArray(data.data)) {
          communities = data.data;
        } else if (Array.isArray(data)) {
          communities = data;
        } else if (data.communities && Array.isArray(data.communities)) {
          communities = data.communities;
        }
        
        const joinedIds = new Set(communities.map(community => community.id));
        setJoinedCommunities(joinedIds);
      }
    } catch (err) {
      console.error('Error fetching joined communities:', err);
    }
  };

  // Handle join status changes from CommunityCard
  const handleJoinStatusChange = (communityId, action) => {
    if (action === 'joined') {
      setJoinedCommunities(prev => new Set([...prev, communityId]));
    } else if (action === 'left') {
      setJoinedCommunities(prev => {
        const newSet = new Set(prev);
        newSet.delete(communityId);
        return newSet;
      });
    }
    // Refresh communities to get updated membership info
    fetchCommunities();
  };

  // Get user location for location-based features
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationPermission('granted');
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationPermission('denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  };

  // Filter and sort communities
  const getFilteredAndSortedCommunities = () => {
    let filtered = [...communities];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedFilter === 'location_bound') {
      filtered = filtered.filter(community => community.type === 'location_bound');
    } else if (selectedFilter === 'agnostic') {
      filtered = filtered.filter(community => community.type === 'agnostic');
    } else if (selectedFilter === 'joined') {
      filtered = filtered.filter(community => joinedCommunities.has(community.id));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'members':
          return (b.member_count || 0) - (a.member_count || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'activity':
          return (b.post_count || 0) - (a.post_count || 0);
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  };

  // Load data on component mount
  useEffect(() => {
    fetchCommunities();
    getUserLocation(); // Try to get user location
  }, []);

  useEffect(() => {
    if (user) {
      fetchJoinedCommunities();
    } else {
      setJoinedCommunities(new Set());
    }
  }, [user]);

  const filteredCommunities = getFilteredAndSortedCommunities();

  return (
    <div className="min-h-screen bg-gradient-to-br from-iosGray-50 via-white to-iosGray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-iosGray-900 mb-2">Discover Communities</h1>
                <p className="text-iosGray-600">
                  Find your tribe and connect with like-minded people around the world
                </p>
              </div>
              {user && (
                <Link
                  to="/create-community"
                  className="flex items-center space-x-2 px-6 py-3 bg-iosBlue text-white rounded-xl font-semibold hover:bg-iosBlue/90 transition-all duration-200 shadow-ios"
                >
                  <span>➕</span>
                  <span>Create Community</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 animate-slide-up">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-iosGray-400 text-lg">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search communities by name, description, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/60 border border-white/30 rounded-xl focus:ring-2 focus:ring-iosBlue/30 focus:border-iosBlue/50 transition-all duration-200 placeholder-iosGray-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                
                {/* Type Filter */}
                <div className="min-w-[200px]">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-white/60 border border-white/30 rounded-xl focus:ring-2 focus:ring-iosBlue/30 focus:border-iosBlue/50 transition-all duration-200"
                  >
                    {filterOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="min-w-[180px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 bg-white/60 border border-white/30 rounded-xl focus:ring-2 focus:ring-iosBlue/30 focus:border-iosBlue/50 transition-all duration-200"
                  >
                    {sortOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {filterOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setSelectedFilter(option.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedFilter === option.id
                      ? 'bg-iosBlue text-white shadow-ios'
                      : 'bg-white/40 text-iosGray-700 hover:bg-white/60'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                  {option.id === 'joined' && joinedCommunities.size > 0 && (
                    <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">
                      {joinedCommunities.size}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {loading ? (
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-12 text-center">
              <LoadingSpinner size="lg" text="Loading communities..." />
            </div>
          ) : error ? (
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-12 text-center">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-semibold text-iosGray-900 mb-2">Something went wrong</h3>
              <p className="text-iosGray-600 mb-6">{error}</p>
              <button
                onClick={fetchCommunities}
                className="px-6 py-3 bg-iosBlue text-white rounded-xl font-semibold hover:bg-iosBlue/90 transition-all duration-200 shadow-ios"
              >
                Try Again
              </button>
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-12 text-center">
              <div className="text-6xl mb-4">
                {searchQuery.trim() ? '🔍' : selectedFilter === 'joined' ? '⭐' : '🏘️'}
              </div>
              <h3 className="text-xl font-semibold text-iosGray-900 mb-2">
                {searchQuery.trim()
                  ? 'No communities found'
                  : selectedFilter === 'joined'
                  ? 'No joined communities'
                  : 'No communities yet'
                }
              </h3>
              <p className="text-iosGray-600 mb-6">
                {searchQuery.trim()
                  ? 'Try adjusting your search terms or filters'
                  : selectedFilter === 'joined'
                  ? 'Join some communities to see them here'
                  : 'Be the first to create a community!'
                }
              </p>
              {user && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/create-community"
                    className="px-6 py-3 bg-iosBlue text-white rounded-xl font-semibold hover:bg-iosBlue/90 transition-all duration-200 shadow-ios"
                  >
                    Create Community
                  </Link>
                  {searchQuery.trim() && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-6 py-3 bg-white/70 backdrop-blur-md text-iosGray-700 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 border border-white/20"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-iosGray-900">
                    {filteredCommunities.length} {filteredCommunities.length === 1 ? 'Community' : 'Communities'}
                  </h2>
                  {searchQuery.trim() && (
                    <div className="px-3 py-1 bg-iosBlue/10 text-iosBlue rounded-full text-sm font-medium">
                      "{searchQuery}"
                    </div>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  {searchQuery.trim() && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-2 text-iosGray-600 hover:bg-white/40 rounded-xl transition-colors duration-200"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    onClick={fetchCommunities}
                    className="p-2 text-iosGray-600 hover:bg-white/40 rounded-xl transition-colors duration-200"
                    title="Refresh"
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Communities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommunities.map((community, index) => (
                  <div
                    key={community.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CommunityCard
                      community={community}
                      userLocation={userLocation}
                      onJoinStatusChange={handleJoinStatusChange}
                    />
                  </div>
                ))}
              </div>

              {/* Load More / Pagination could go here */}
              {filteredCommunities.length >= 20 && (
                <div className="text-center mt-8">
                  <button className="px-6 py-3 bg-white/70 backdrop-blur-md text-iosGray-700 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 border border-white/20">
                    Load More Communities
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Statistics Footer */}
        <div className="mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-iosBlue mb-1">{communities.length}</div>
                <div className="text-sm text-iosGray-600">Total Communities</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-iosGreen mb-1">
                  {communities.filter(c => c.type === 'location_bound').length}
                </div>
                <div className="text-sm text-iosGray-600">Location-Based</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-iosPurple mb-1">
                  {communities.filter(c => c.type === 'agnostic').length}
                </div>
                <div className="text-sm text-iosGray-600">Global Communities</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-iosOrange mb-1">{joinedCommunities.size}</div>
                <div className="text-sm text-iosGray-600">Your Communities</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communities;
