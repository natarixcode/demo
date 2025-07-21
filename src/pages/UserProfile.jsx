// src/pages/UserProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDraftManager } from "../hooks/useApi";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';

/**
 * User Profile Page Component
 * Features:
 * - User information and stats
 * - User's published posts
 * - User's drafts (if viewing own profile)
 * - Activity history and achievements
 * - Beautiful glassmorphism design
 */
const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Draft manager for current user
  const { drafts, loading: draftsLoading } = useDraftManager(user?.id);

  const isOwnProfile = userProfile && user && userProfile.id === user.id;

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch user info
        const userResponse = await fetch(`http://localhost:5000/api/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error('User not found');
        }
        const userData = await userResponse.json();
        setUserProfile(userData.data);

        // Fetch user's posts
        const postsResponse = await fetch(`http://localhost:5000/api/users/${userId}/posts`);
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setUserPosts(postsData.data || []);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const truncateContent = (content, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, maxLength) + '...';
  };

  const handlePublishDraft = async (draftId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${draftId}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success('Draft published successfully!');
        // Refresh the page to update the data
        window.location.reload();
      } else {
        toast.error('Failed to publish draft');
      }
    } catch (error) {
      toast.error('Error publishing draft');
    }
  };

  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success('Draft deleted successfully!');
        // Refresh the page to update the data
        window.location.reload();
      } else {
        toast.error('Failed to delete draft');
      }
    } catch (error) {
      toast.error('Error deleting draft');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-6 py-2"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Calculate user stats
  const totalPosts = userPosts.length;
  const totalUpvotes = userPosts.reduce((sum, post) => sum + (post.upvotes || 0), 0);
  const totalComments = userPosts.reduce((sum, post) => sum + (post.comment_count || 0), 0);
  const joinedDate = formatTimeAgo(userProfile.created_at);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 hover:scale-105 transition-all duration-200"
            >
              <span>←</span>
              <span className="font-medium text-gray-900">Back</span>
            </button>
            
            <h1 className="text-xl font-bold text-gray-900">
              {userProfile.username}'s Profile
            </h1>
            
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-24 px-4 max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="glass-card rounded-2xl p-6 mb-8 animate-glass-fade-in">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-3xl">
              {userProfile.username[0].toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{userProfile.username}</h1>
                {userProfile.username === 'admin' && (
                  <span className="px-3 py-1 bg-gradient-to-r from-gold-400 to-yellow-500 text-white text-sm rounded-full">
                    Admin
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-4">
                Joined {joinedDate} • {userProfile.email}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalPosts}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalUpvotes}</div>
                  <div className="text-sm text-gray-600">Upvotes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalComments}</div>
                  <div className="text-sm text-gray-600">Comments</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              {isOwnProfile ? (
                <>
                  <Link
                    to="/create-post"
                    className="btn-primary px-6 py-2"
                  >
                    ✨ Create Post
                  </Link>
                  <button className="btn-secondary px-6 py-2">
                    ⚙️ Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-primary px-6 py-2">
                    👤 Follow
                  </button>
                  <button className="btn-secondary px-6 py-2">
                    💬 Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-2 font-medium transition-colors duration-200 ${
                activeTab === 'posts'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 Posts ({totalPosts})
            </button>
            
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('drafts')}
                className={`pb-2 font-medium transition-colors duration-200 ${
                  activeTab === 'drafts'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📄 Drafts ({drafts.length})
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-2 font-medium transition-colors duration-200 ${
                activeTab === 'activity'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Activity
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {userPosts.length > 0 ? (
                userPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="glass-card rounded-xl p-6 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          to={`/post/${post.id}`}
                          className="group"
                        >
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 mb-3 line-clamp-3">
                            {truncateContent(post.content)}
                          </p>
                        </Link>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <span className="flex items-center">
                            <span className="mr-1">↑</span>
                            {(post.upvotes || 0) - (post.downvotes || 0)} votes
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">💬</span>
                            {post.comment_count || 0} comments
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">🔗</span>
                            {post.share_count || 0} shares
                          </span>
                          <span>{formatTimeAgo(post.created_at)}</span>
                        </div>
                      </div>
                      
                      {isOwnProfile && (
                        <div className="flex space-x-2">
                          <Link
                            to={`/edit-post/${post.id}`}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                          >
                            ✏️
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <p className="text-gray-500 mb-4">
                    {isOwnProfile ? "You haven't created any posts yet." : "This user hasn't created any posts yet."}
                  </p>
                  {isOwnProfile && (
                    <Link
                      to="/create-post"
                      className="btn-primary px-6 py-2"
                    >
                      Create your first post
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'drafts' && isOwnProfile && (
            <div className="space-y-4">
              {draftsLoading ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <LoadingSpinner size="md" text="Loading drafts..." />
                </div>
              ) : drafts.length > 0 ? (
                drafts.map((draft, index) => (
                  <div
                    key={draft.id}
                    className="glass-card rounded-xl p-6 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {draft.title}
                          </h3>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            Draft
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-3">
                          {truncateContent(draft.content)}
                        </p>
                        
                        <div className="text-sm text-gray-600">
                          Last edited {formatTimeAgo(draft.updated_at)}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          to={`/edit-post/${draft.id}`}
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handlePublishDraft(draft.id)}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="text-red-600 hover:text-red-800 px-2"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <p className="text-gray-500 mb-4">You don't have any drafts yet.</p>
                  <Link
                    to="/create-post"
                    className="btn-primary px-6 py-2"
                  >
                    Create a draft
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">Created a new post</p>
                    <p className="text-sm text-gray-600">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">Received 10 upvotes</p>
                    <p className="text-sm text-gray-600">1 day ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">Joined the community</p>
                    <p className="text-sm text-gray-600">{joinedDate}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserProfile; 