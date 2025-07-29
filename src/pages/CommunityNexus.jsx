// src/pages/CommunityNexus.jsx - The Ultimate Community Exploration Hub
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Search, Filter, MapPin, TrendingUp, Clock, Crown, 
  Users, Activity, Globe, Compass, Sparkles, Zap,
  Grid, List, Map, Heart, Star, ChevronDown, X
} from 'lucide-react';
import CommunityCard from '../components/CommunityCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CommunityNexus = () => {
  const { user, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State Management
  const [communities, setCommunities] = useState([]);
  const [discoveryData, setDiscoveryData] = useState(null);
  const [joinedCommunities, setJoinedCommunities] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  // UI State
  const [viewMode, setViewMode] = useState('discovery'); // discovery, grid, list
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'trending');
  const [showFilters, setShowFilters] = useState(false);
  const [radius, setRadius] = useState(10);

  // Filter and Sort Options
  const viewModes = [
    { id: 'discovery', label: 'Discovery', icon: Compass, description: 'Smart sections' },
    { id: 'grid', label: 'Grid', icon: Grid, description: 'Card layout' },
    { id: 'list', label: 'List', icon: List, description: 'Compact view' }
  ];

  const filterOptions = [
    { id: 'all', label: 'All Communities', icon: Globe, color: 'text-blue-600' },
    { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'text-orange-600' },
    { id: 'nearby', label: 'Nearby', icon: MapPin, color: 'text-green-600' },
    { id: 'popular', label: 'Popular', icon: Crown, color: 'text-purple-600' },
    { id: 'latest', label: 'Latest', icon: Clock, color: 'text-indigo-600' },
    { id: 'joined', label: 'My Communities', icon: Heart, color: 'text-pink-600' },
    { id: 'location_bound', label: 'Location-Based', icon: MapPin, color: 'text-green-600' },
    { id: 'global', label: 'Global', icon: Globe, color: 'text-blue-600' }
  ];

  const sortOptions = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'members', label: 'Most Members', icon: Users },
    { id: 'activity', label: 'Most Active', icon: Activity },
    { id: 'newest', label: 'Newest', icon: Clock },
    { id: 'name', label: 'Alphabetical', icon: Sparkles }
  ];

  // Get user location
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
        }
      );
    }
  }, []);

  // Fetch data when parameters change
  useEffect(() => {
    fetchData();
  }, [activeFilter, sortBy, searchQuery, userLocation, radius]);

  // Fetch joined communities
  useEffect(() => {
    if (user) {
      fetchJoinedCommunities();
    }
  }, [user]);

  // Update URL parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (activeFilter !== 'all') params.set('filter', activeFilter);
    if (sortBy !== 'trending') params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchQuery, activeFilter, sortBy, setSearchParams]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Use the unified Nexus API
      let url = 'http://localhost:3001/api/nexus';
      let params = new URLSearchParams();

      // Add common parameters
      params.append('view', viewMode);
      params.append('filter', activeFilter);
      params.append('sort', sortBy);
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
        params.append('radius', radius);
      }
      
      if (user?.id) {
        params.append('user_id', user.id);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const headers = {
        'Content-Type': 'application/json',
        ...(user ? getAuthHeader() : {})
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (searchQuery && data.search) {
        setCommunities(data.search);
        setDiscoveryData(null);
      } else if (viewMode === 'discovery' && data.trending) {
        setDiscoveryData(data);
        // Combine all communities for filtering
        const allCommunities = [
          ...(data.trending || []),
          ...(data.nearby || []),
          ...(data.popular || []),
          ...(data.latest || [])
        ];
        setCommunities(removeDuplicates(allCommunities));
      } else if (data.communities) {
        setCommunities(data.communities);
        setDiscoveryData(null);
      } else {
        // Fallback for other data formats
        setCommunities([]);
        setDiscoveryData(data);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      toast.error('Failed to load communities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [viewMode, activeFilter, sortBy, searchQuery, userLocation, radius, user, getAuthHeader]);

  const fetchJoinedCommunities = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/communities/my', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (response.ok) {
        const data = await response.json();
        const communities = data.success ? data.data : (data.communities || data);
        const joinedIds = new Set(communities.map(c => c.id));
        setJoinedCommunities(joinedIds);
      }
    } catch (err) {
      console.error('Error fetching joined communities:', err);
    }
  };

  const removeDuplicates = (communities) => {
    const seen = new Set();
    return communities.filter(community => {
      if (seen.has(community.id)) {
        return false;
      }
      seen.add(community.id);
      return true;
    });
  };

  const getFilteredCommunities = () => {
    let filtered = [...communities];

    // Apply active filter
    switch (activeFilter) {
      case 'joined':
        filtered = filtered.filter(c => joinedCommunities.has(c.id));
        break;
      case 'location_bound':
        filtered = filtered.filter(c => c.type === 'location_bound');
        break;
      case 'global':
        filtered = filtered.filter(c => c.type === 'agnostic');
        break;
      // trending, nearby, popular, latest are handled by API
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'members':
          return (b.member_count || 0) - (a.member_count || 0);
        case 'activity':
          return (b.post_count || 0) - (a.post_count || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'trending':
        default:
          return ((b.member_count || 0) + (b.post_count || 0) * 2) - 
                 ((a.member_count || 0) + (a.post_count || 0) * 2);
      }
    });

    return filtered;
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setViewMode('grid'); // Switch to grid view for search results
  };

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
    fetchData(); // Refresh data
  };

  const renderDiscoveryView = () => {
    if (!discoveryData) return null;

    return (
      <div className="space-y-12">
        {/* Trending Section */}
        {discoveryData.trending && discoveryData.trending.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🔥 Trending Communities</h2>
                <p className="text-gray-600 text-sm">Most active communities this week</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {discoveryData.trending.slice(0, 8).map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  userLocation={userLocation}
                  onJoinStatusChange={handleJoinStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* Nearby Section */}
        {userLocation && discoveryData.nearby && discoveryData.nearby.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-xl">
                  <MapPin size={24} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">📍 Nearby Communities</h2>
                  <p className="text-gray-600 text-sm">Communities within {radius}km of your location</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Radius:</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm font-semibold text-green-600">{radius}km</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {discoveryData.nearby.slice(0, 8).map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  userLocation={userLocation}
                  onJoinStatusChange={handleJoinStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* Popular Section */}
        {discoveryData.popular && discoveryData.popular.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl">
                <Crown size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">👑 Popular Communities</h2>
                <p className="text-gray-600 text-sm">Communities with the most members</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {discoveryData.popular.slice(0, 8).map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  userLocation={userLocation}
                  onJoinStatusChange={handleJoinStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* Latest Section */}
        {discoveryData.latest && discoveryData.latest.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-xl">
                <Clock size={24} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">✨ Latest Communities</h2>
                <p className="text-gray-600 text-sm">Recently created communities to explore</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {discoveryData.latest.slice(0, 8).map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  userLocation={userLocation}
                  onJoinStatusChange={handleJoinStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* Statistics */}
        {discoveryData.totalCounts && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Platform Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{discoveryData.totalCounts.total}</div>
                <div className="text-gray-600">Total Communities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{discoveryData.totalCounts.trending}</div>
                <div className="text-gray-600">Active This Week</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{discoveryData.totalCounts.locationBound}</div>
                <div className="text-gray-600">Location-Based</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGridView = () => {
    const filtered = getFilteredCommunities();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {filtered.length} {filtered.length === 1 ? 'Community' : 'Communities'}
          </h2>
          {searchQuery && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Search:</span>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                "{searchQuery}"
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              userLocation={userLocation}
              onJoinStatusChange={handleJoinStatusChange}
            />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Community Nexus..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-screen-2xl mx-auto p-4 space-y-8">
        {/* Hero Header */}
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
              <Compass size={32} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Community <span className="text-gradient">Nexus</span>
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Your central hub for discovering, exploring, and connecting with amazing communities worldwide
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-6">
                <div className="flex items-center gap-4">
                  <Search size={24} className="text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                    placeholder="Search communities by name, topic, or location..."
                    className="flex-1 text-lg bg-transparent border-none outline-none placeholder-gray-500 text-gray-900"
                  />
                  <button
                    onClick={() => handleSearch(searchQuery)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
                  >
                    <Sparkles size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/30 space-y-4">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              {viewModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                      viewMode === mode.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/50 text-gray-700 hover:bg-white/70'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>

            {user && (
              <button
                onClick={() => navigate('/create-community')}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-md"
              >
                <Zap size={18} />
                <span>Create Community</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeFilter === filter.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white/50 text-gray-700 hover:bg-white/70'
                  }`}
                >
                  <Icon size={16} className={activeFilter === filter.id ? 'text-white' : filter.color} />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white/60 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-12 text-center border border-white/30">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : viewMode === 'discovery' && !searchQuery ? (
          renderDiscoveryView()
        ) : (
          renderGridView()
        )}

        {/* Empty State */}
        {!loading && !error && communities.length === 0 && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-12 text-center border border-white/30">
            <div className="text-6xl mb-4">🏘️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No communities found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? `No results for "${searchQuery}"` : 'Be the first to create a community!'}
            </p>
            {user && (
              <button
                onClick={() => navigate('/create-community')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Community
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityNexus; 