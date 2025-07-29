// src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import BadgeSection from '../components/BadgeDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const UserProfile = () => {
  const { userId: id } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const { get } = useApi();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        console.log('🔍 UserProfile: Starting to fetch user data for ID:', id);
        
        // Fetch user info
        console.log('📡 UserProfile: Fetching user info...');
        const userResponse = await get(`/api/users/${id}`);
        console.log('📦 UserProfile: User response:', userResponse);
        
        if (userResponse.data) {
          setUser(userResponse.data);
          console.log('✅ UserProfile: User data set successfully:', userResponse.data);
        } else {
          console.error('❌ UserProfile: User response not successful:', userResponse);
        }
        
        // Fetch user posts
        console.log('📡 UserProfile: Fetching user posts...');
        const postsResponse = await get(`/api/users/${id}/posts`);
        console.log('📦 UserProfile: Posts response:', postsResponse);
        
        if (postsResponse.data) {
          setPosts(postsResponse.data);
          console.log('✅ UserProfile: Posts data set successfully:', postsResponse.data);
        } else {
          console.error('❌ UserProfile: Posts response not successful:', postsResponse);
        }
        
      } catch (error) {
        console.error('💥 UserProfile: Error fetching user data:', error);
      } finally {
        setLoading(false);
        console.log('🏁 UserProfile: Loading completed');
      }
    };

    if (id) {
      console.log('🚀 UserProfile: Component mounted with ID:', id);
      fetchUserData();
    } else {
      console.error('❌ UserProfile: No ID provided from URL params');
    }
  }, [id, get]);

  if (loading) {
    console.log('⏳ UserProfile: Showing loading spinner');
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log('👤 UserProfile: No user data, showing not found message');
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  console.log('🎨 UserProfile: Rendering profile for user:', user.username);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
            <p className="text-gray-600 mb-4">{user.email}</p>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{posts.length}</span>
                <span>Posts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{user.karma || 0}</span>
                <span>Karma</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Joined</span>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'posts', label: 'Posts', count: posts.length },
            { id: 'badges', label: 'Badges', count: null },
            { id: 'activity', label: 'Activity', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-4">
                          <span>👍 {post.upvotes || 0}</span>
                          <span>👎 {post.downvotes || 0}</span>
                          <span>💬 {post.comment_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                  <p className="text-gray-600">This user hasn't created any posts.</p>
                </div>
              )}
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div>
              <BadgeSection userId={id} title="User Badges" showStats={true} />
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity Feed</h3>
              <p className="text-gray-600">Activity tracking coming soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 