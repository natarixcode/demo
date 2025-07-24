import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SubClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getAuthHeader } = useAuth();
  
  const [subClub, setSubClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubClub();
  }, [id, user]);

  const fetchSubClub = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/subclubs/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(user ? getAuthHeader() : {})
        }
      });

      const data = await response.json();

      if (data.success) {
        setSubClub(data.data);
      } else {
        setError(data.error || 'Failed to load sub-club');
      }
    } catch (err) {
      console.error('Error fetching sub-club:', err);
      setError('Failed to load sub-club');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
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

  if (!subClub) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sub-Club Not Found</h2>
          <p className="text-gray-600 mb-6">The sub-club you're looking for doesn't exist.</p>
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
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        {/* Sub-Club Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">{subClub.name}</h1>
            <p className="text-purple-100 mb-4 leading-relaxed">
              {subClub.description || 'No description available'}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a6 6 0 01-4.5 4.844" />
                </svg>
                {subClub.actual_member_count || subClub.member_count || 0} members
              </div>
              
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Created by {subClub.creator_name}
              </div>
              
              {subClub.community_name && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Part of {subClub.community_name}
                </div>
              )}
              
              {subClub.location && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {subClub.location}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                subClub.visibility === 'public' 
                  ? 'bg-green-100 bg-opacity-20 text-green-100 border border-green-200' 
                  : 'bg-yellow-100 bg-opacity-20 text-yellow-100 border border-yellow-200'
              }`}>
                {subClub.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                subClub.type === 'agnostic' 
                  ? 'bg-blue-100 bg-opacity-20 text-blue-100 border border-blue-200' 
                  : 'bg-purple-100 bg-opacity-20 text-purple-100 border border-purple-200'
              }`}>
                {subClub.type === 'agnostic' ? '🌍 Location Agnostic' : '📍 Location Bound'}
              </span>
            </div>
          </div>
        </div>

        {/* Simple Sub-Club Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">About this Sub-Club</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Visibility</h4>
              <p className="text-gray-600">{subClub.visibility === 'public' ? 'Open to everyone' : 'Private - invitation only'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Type</h4>
              <p className="text-gray-600">{subClub.type === 'agnostic' ? 'Location independent' : 'Location based'}</p>
            </div>
          </div>
          
          {user && (
            <div className="mt-6 flex gap-3">
              {subClub.user_role && (
                <Link
                  to={`/subclubs/${id}/create-post`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Post
                </Link>
              )}
              
              {!subClub.user_role && (
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Join Sub-Club
                </button>
              )}
            </div>
          )}
        </div>

        {/* Posts Placeholder */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Posts</h2>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No posts yet in this sub-club</p>
            {subClub.user_role && (
              <Link
                to={`/subclubs/${id}/create-post`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create the first post
              </Link>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/communities')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Communities
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubClubDetail; 