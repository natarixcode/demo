import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const CreateSubClub = () => {
  const { user, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const { communityId } = useParams();
  
  const [community, setCommunity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public',
    type: 'agnostic',
    location: '',
    latitude: '',
    longitude: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    fetchCommunity();
  }, [communityId]);

  const fetchCommunity = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/communities/${communityId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      const data = await response.json();

      if (data.success) {
        setCommunity(data.data);
        
        // Check if user is a member of the community
        if (!data.data.user_role) {
          setError('You must be a member of the community to create a sub-club');
        }
      } else {
        setError(data.error || 'Community not found');
      }
    } catch (err) {
      console.error('Error fetching community:', err);
      setError('Failed to load community');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter it manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Sub-club name is required');
      setLoading(false);
      return;
    }

    if (formData.type === 'location_bound' && !formData.location.trim()) {
      setError('Location is required for location-bound sub-clubs');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/sub-clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          ...formData,
          community_id: parseInt(communityId),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null
        })
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/communities/${communityId}`);
      } else {
        setError(data.error || 'Failed to create sub-club');
      }
    } catch (err) {
      console.error('Error creating sub-club:', err);
      setError('Failed to create sub-club. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Sub-Club</h1>
            <p className="text-gray-600">
              Creating a sub-club in <strong>{community.name}</strong>
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sub-Club Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Sub-Club Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter sub-club name"
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your sub-club..."
                disabled={loading}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={handleInputChange}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm">
                    <strong>Public</strong> - Community members can join immediately
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={handleInputChange}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm">
                    <strong>Private</strong> - Requires approval to join
                  </span>
                </label>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub-Club Type *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="agnostic"
                    checked={formData.type === 'agnostic'}
                    onChange={handleInputChange}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm">
                    <strong>Location Agnostic</strong> - Inherits from parent community
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="location_bound"
                    checked={formData.type === 'location_bound'}
                    onChange={handleInputChange}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm">
                    <strong>Location Bound</strong> - Override with specific location
                  </span>
                </label>
              </div>
            </div>

            {/* Location (shown only for location-bound sub-clubs) */}
            {formData.type === 'location_bound' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">Location Information</h3>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location (City, State/Country) *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Downtown San Francisco, CA"
                    required={formData.type === 'location_bound'}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude (Optional)
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      step="any"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="37.7749"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude (Optional)
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      step="any"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="-122.4194"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  disabled={loading}
                >
                  📍 Get My Location
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Creating...' : 'Create Sub-Club'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/communities/${communityId}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSubClub; 