import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateCommunity = () => {
  const { user, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public',
    type: 'agnostic',
    location: '',
    latitude: '',
    longitude: '',
    radius_km: 5,
    pin_code: '',
    tags: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));

        // Try to get location name using reverse geocoding (simplified)
        try {
          const locationName = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          setFormData(prev => ({
            ...prev,
            location: locationName
          }));
        } catch (err) {
          console.error('Error getting location name:', err);
        }

        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to get your location. Please enter manually.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Handle radius change
  const handleRadiusChange = (e) => {
    const radius = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      radius_km: radius
    }));
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
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
      setError('Community name is required');
      setLoading(false);
      return;
    }

    if (formData.type === 'location_bound' && !formData.location.trim()) {
      setError('Location is required for location-bound communities');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null
        })
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/communities/${data.data.id}`);
      } else {
        setError(data.error || 'Failed to create community');
      }
    } catch (err) {
      console.error('Error creating community:', err);
      setError('Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Community</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Community Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter community name"
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
                placeholder="Describe your community..."
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
                    <strong>Public</strong> - Anyone can join immediately
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
                Community Type *
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
                    <strong>Location Agnostic</strong> - Open to members from anywhere
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
                    <strong>Location Bound</strong> - Tied to a specific location
                  </span>
                </label>
              </div>
            </div>

            {/* Location (shown only for location-bound communities) */}
            {formData.type === 'location_bound' && (
              <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📍</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Location Settings</h3>
                </div>
                
                {/* Location Name */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Bidholi, Dehradun"
                    required={formData.type === 'location_bound'}
                    disabled={loading}
                  />
                </div>

                {/* PIN Code */}
                <div>
                  <label htmlFor="pin_code" className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code (Optional)
                  </label>
                  <input
                    type="text"
                    id="pin_code"
                    name="pin_code"
                    value={formData.pin_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 248007"
                    maxLength="10"
                    disabled={loading}
                  />
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      step="any"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30.2849"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      step="any"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="78.0422"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Auto-location button */}
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={loading || locationLoading}
                  >
                    {locationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Getting Location...</span>
                      </>
                    ) : (
                      <>
                        <span>📍</span>
                        <span>Use My Current Location</span>
                      </>
                    )}
                  </button>
                  
                  {locationError && (
                    <span className="text-red-600 text-sm">{locationError}</span>
                  )}
                </div>

                {/* Radius Selector */}
                <div>
                  <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                    Community Radius: <span className="font-bold text-blue-600">{formData.radius_km} km</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      id="radius"
                      min="1"
                      max="50"
                      value={formData.radius_km}
                      onChange={handleRadiusChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      disabled={loading}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 km</span>
                      <span>25 km</span>
                      <span>50 km</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Only users within {formData.radius_km} km of this location can join the community
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {formData.latitude && formData.longitude && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">📍 Location Preview</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Location:</strong> {formData.location}</p>
                      {formData.pin_code && <p><strong>PIN:</strong> {formData.pin_code}</p>}
                      <p><strong>Coordinates:</strong> {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}</p>
                      <p><strong>Radius:</strong> {formData.radius_km} km</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a tag..."
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={loading || !tagInput.trim()}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Creating...' : 'Create Community'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/communities')}
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

export default CreateCommunity; 