// src/components/EditProfileForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

/**
 * Edit Profile Form Component
 * Allows users to update their profile information (bio, location, display name, avatar color)
 */
const EditProfileForm = ({ user, onProfileUpdate }) => {
  const { getAuthHeader } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    display_name: user?.display_name || '',
    avatar_color: user?.avatar_color || '#3B82F6'
  });

  // Predefined avatar colors
  const avatarColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6366F1'  // Indigo
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({
      ...prev,
      avatar_color: color
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully! ✨');
        setIsEditing(false);
        
        // Notify parent component of profile update
        if (onProfileUpdate) {
          onProfileUpdate(data.data);
        }
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      bio: user?.bio || '',
      location: user?.location || '',
      display_name: user?.display_name || '',
      avatar_color: user?.avatar_color || '#3B82F6'
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="mt-8">
        <button 
          onClick={() => setIsEditing(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          ✏️ Edit Profile
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          ✏️ Edit Your Profile
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Your username"
              required
              minLength={3}
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name (Optional)
            </label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="How others see your name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Where are you from?"
            />
          </div>

          {/* Avatar Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar Color
            </label>
            <div className="flex flex-wrap gap-3">
              {avatarColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                    formData.avatar_color === color 
                      ? 'border-gray-800 shadow-lg' 
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Selected: <span className="font-medium">{formData.avatar_color}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Saving...' : '✅ Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              ❌ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileForm; 