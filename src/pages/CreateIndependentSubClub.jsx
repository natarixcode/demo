import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateIndependentSubClub = () => {
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
    seeking_community: false,
    tags: [],
    rules: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddRule = () => {
    const rule = ruleInput.trim();
    if (rule && !formData.rules.includes(rule)) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, rule]
      }));
      setRuleInput('');
    }
  };

  const handleRemoveRule = (ruleToRemove) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule !== ruleToRemove)
    }));
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
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

        // Try to get location name using reverse geocoding (optional)
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          if (data.city && data.countryName) {
            setFormData(prev => ({
              ...prev,
              location: `${data.city}, ${data.countryName}`
            }));
          }
        } catch (err) {
          console.log('Could not get location name:', err);
        }
        
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Unable to get your location. Please enter it manually.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
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
      const response = await fetch('http://localhost:3001/api/sub-clubs/independent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          is_independent: true
        })
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/sub-clubs/${data.data.id}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Independent Sub-Club</h1>
            <p className="text-gray-600">
              Create a sub-club that can exist independently or later join a community. 
              Independent sub-clubs give you full control and can request to join communities later.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sub-Club Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-Club Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your sub-club name"
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe what your sub-club is about..."
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
                      <strong>Public</strong> - Anyone can join and see content
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
                  Type *
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
                      <strong>Global</strong> - Open to everyone worldwide
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
                      <strong>Location-bound</strong> - Limited to specific location
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Location Information (if location-bound) */}
            {formData.type === 'location_bound' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter location (e.g., New York, NY)"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={locationLoading || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {locationLoading ? 'Getting...' : '📍 Current'}
                      </button>
                    </div>
                  </div>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="40.7128"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="-74.0060"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Community Seeking */}
            <div className="bg-green-50 p-4 rounded-lg">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="seeking_community"
                  checked={formData.seeking_community}
                  onChange={handleInputChange}
                  className="mr-3"
                  disabled={loading}
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Looking to join a community
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    Check this if you'd like your sub-club to be discoverable by community admins for potential inclusion
                  </p>
                </div>
              </label>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tagInput" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  id="tagInput"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add tags (e.g., javascript, react, frontend)"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={loading}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Rules */}
            <div>
              <label htmlFor="ruleInput" className="block text-sm font-medium text-gray-700 mb-2">
                Rules
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  id="ruleInput"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add a rule for your sub-club"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
              
              {formData.rules.length > 0 && (
                <div className="space-y-2">
                  {formData.rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">
                        {index + 1}. {rule}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(rule)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/communities')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Sub-Club'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateIndependentSubClub; 