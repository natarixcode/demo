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
  const { user, isAuthenticated, getAuthHeader } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [userSubClubs, setUserSubClubs] = useState([]);
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
        const userResponse = await fetch(`http://localhost:3001/api/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error('User not found');
        }
        const userData = await userResponse.json();
        setUserProfile(userData.data);

        // Fetch user's posts
        const postsResponse = await fetch(`http://localhost:3001/api/users/${userId}/posts`);
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setUserPosts(postsData.data || []);
        }

        // Fetch user's communities (only if viewing own profile or if authenticated)
        if (isAuthenticated && (user?.id === parseInt(userId) || user?.id === userId)) {
          try {
            const communitiesResponse = await fetch(`http://localhost:3001/api/communities/my`, {
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
              }
            });
            if (communitiesResponse.ok) {
              const communitiesData = await communitiesResponse.json();
              setUserCommunities(communitiesData.data || communitiesData.communities || []);
            }

            // Fetch user's sub-clubs
            const subClubsResponse = await fetch(`http://localhost:3001/api/sub-clubs/my`, {
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
              }
            });
            if (subClubsResponse.ok) {
              const subClubsData = await subClubsResponse.json();
              setUserSubClubs(subClubsData.data || subClubsData.subClubs || []);
            }
          } catch (err) {
            console.error('Error fetching user communities:', err);
          }
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
      const response = await fetch(`http://localhost:3001/api/posts/${draftId}/publish`, {
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
      const response = await fetch(`http://localhost:3001/api/posts/${draftId}`, {
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
              <div className={`grid gap-4 ${isOwnProfile ? 'grid-cols-5' : 'grid-cols-3'}`}>
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
                {isOwnProfile && (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{userCommunities.length}</div>
                      <div className="text-sm text-gray-600">Communities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{userSubClubs.length}</div>
                      <div className="text-sm text-gray-600">Sub-Clubs</div>
                    </div>
                  </>
                )}
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

            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('communities')}
                className={`pb-2 font-medium transition-colors duration-200 ${
                  activeTab === 'communities'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏘️ Communities ({userCommunities.length})
              </button>
            )}

            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('subclubs')}
                className={`pb-2 font-medium transition-colors duration-200 ${
                  activeTab === 'subclubs'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🎯 Sub-Clubs ({userSubClubs.length})
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

          {activeTab === 'communities' && (
            <div className="space-y-4">
              {userCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCommunities.map((community, index) => (
                    <div
                      key={community.id}
                      className="glass-card rounded-xl p-6 animate-slide-up hover:shadow-lg transition-shadow"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Link 
                            to={`/communities/${community.id}`}
                            className="text-xl font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            {community.name}
                          </Link>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              community.role === 'creator' ? 'bg-purple-100 text-purple-800' :
                              community.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {community.role === 'creator' ? '👑 Creator' :
                               community.role === 'moderator' ? '🛡️ Moderator' :
                               '👤 Member'}
                            </span>
                            
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              community.type === 'location_bound' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {community.type === 'location_bound' ? '📍 Location-bound' : '🌐 Global'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {community.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {community.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>👥 {community.actual_member_count || community.member_count || 0} members</span>
                        {community.location && (
                          <span>📍 {community.location}</span>
                        )}
                      </div>

                      {community.tags && community.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {community.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span 
                              key={tagIndex}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                          {community.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{community.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Joined {formatTimeAgo(community.joined_at || community.user_joined_at)}
                        </span>
                        
                        <Link
                          to={`/communities/${community.id}`}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No communities joined yet</h4>
                  <p className="text-gray-600 mb-4">Start by exploring and joining communities that interest you!</p>
                  <Link
                    to="/communities"
                    className="btn-primary px-6 py-2"
                  >
                    Browse Communities
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subclubs' && (
            <div className="space-y-4">
              {userSubClubs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userSubClubs.map((subClub, index) => (
                    <div
                      key={subClub.id}
                      className="glass-card rounded-xl p-6 animate-slide-up hover:shadow-lg transition-shadow"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Link 
                            to={`/sub-clubs/${subClub.id}`}
                            className="text-xl font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            {subClub.name}
                          </Link>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              subClub.role === 'creator' ? 'bg-purple-100 text-purple-800' :
                              subClub.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {subClub.role === 'creator' ? '👑 Creator' :
                               subClub.role === 'moderator' ? '🛡️ Moderator' :
                               '👤 Member'}
                            </span>
                            
                            {subClub.is_independent ? (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                🆓 Independent
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                🏘️ In Community
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {subClub.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {subClub.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>👥 {subClub.actual_member_count || subClub.member_count || 0} members</span>
                        {subClub.community_name && (
                          <span>🏘️ {subClub.community_name}</span>
                        )}
                      </div>

                      {subClub.tags && subClub.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {subClub.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span 
                              key={tagIndex}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                          {subClub.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{subClub.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Joined {formatTimeAgo(subClub.joined_at || subClub.user_joined_at)}
                        </span>
                        
                        <Link
                          to={`/sub-clubs/${subClub.id}`}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No sub-clubs yet</h4>
                  <p className="text-gray-600 mb-4">Create or join sub-clubs to connect with like-minded people!</p>
                  <div className="flex justify-center space-x-3">
                    <Link
                      to="/create-subclub"
                      className="btn-primary px-6 py-2"
                    >
                      Create Independent Sub-Club
                    </Link>
                    <Link
                      to="/communities"
                      className="btn-secondary px-6 py-2"
                    >
                      Browse Communities
                    </Link>
                  </div>
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