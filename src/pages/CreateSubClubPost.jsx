import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const CreateSubClubPost = () => {
  const { user, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const { subClubId } = useParams();
  
  const [subClub, setSubClub] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    fetchSubClub();
  }, [subClubId]);

  const fetchSubClub = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/subclubs/${subClubId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      const data = await response.json();

      if (data.success) {
        setSubClub(data.data);
        
        // Check if user is a member of the sub-club
        if (!data.data.user_role) {
          setError('You must be a member of the sub-club to create posts');
        }
      } else {
        setError(data.error || 'Sub-club not found');
      }
    } catch (err) {
      console.error('Error fetching sub-club:', err);
      setError('Failed to load sub-club');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Post title is required');
      setLoading(false);
      return;
    }

    if (!formData.content.trim()) {
      setError('Post content is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          author: user.id,
          sub_club_id: parseInt(subClubId),
          is_draft: false
        })
      });

      const data = await response.json();

      if (data.success || data.data) {
        navigate(`/subclubs/${subClubId}`);
      } else {
        setError(data.error || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!subClub && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading sub-club...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/communities')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Post</h1>
              <p className="text-gray-600 mt-1">
                Share something with <span className="font-semibold text-purple-600">{subClub?.name}</span>
              </p>
            </div>
            <button
              onClick={() => navigate(`/subclubs/${subClubId}`)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {subClub && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-medium">Posting to:</span>
                <span className="ml-1 font-semibold text-purple-700">{subClub.name}</span>
                {subClub.community_name && (
                  <>
                    <span className="mx-2">•</span>
                    <span>in {subClub.community_name}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Post Creation Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Post Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="What's your post about?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                maxLength={255}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.title.length}/255 characters
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Post Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Share your thoughts, ideas, or experiences..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-vertical"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.content.length} characters
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/subclubs/${subClubId}`)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="px-8 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Post...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Publish Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Guidelines */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 Posting Guidelines</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              Make sure your post is relevant to the sub-club topic
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              Be respectful and constructive in your discussions
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              Use clear and descriptive titles
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              Follow the sub-club and community rules
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateSubClubPost; 