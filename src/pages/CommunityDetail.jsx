import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getAuthHeader, isLoading: authLoading } = useAuth();
  
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateSubClub, setShowCreateSubClub] = useState(false);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showPosts, setShowPosts] = useState(true);

  useEffect(() => {
    // Wait for authentication to complete before making API calls
    if (!authLoading) {
    fetchCommunity();
      if (showPosts) {
        fetchPosts();
      }
    }
  }, [id, user, showPosts, authLoading]);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      setError('');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth header if user is logged in
      if (user) {
        const authHeaders = getAuthHeader();
        Object.assign(headers, authHeaders);
      }

      console.log('🚀 Fetching community with headers:', headers);
      console.log('🧑‍💻 Current user:', user);

      const response = await fetch(`http://localhost:3001/api/communities/${id}`, {
        headers
      });

      const data = await response.json();
      console.log('📦 Community API Response:', data);

      if (data.success) {
        console.log('✅ Community data received. User role:', data.data.user_role);
        console.log('🏢 SubClubs data:', data.data.sub_clubs);
        setCommunity(data.data);
      } else {
        setError(data.error || 'Failed to load community');
      }
    } catch (err) {
      console.error('❌ Error fetching community:', err);
      setError('Failed to load community');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/communities/${id}/members`, {
        headers: {
          'Content-Type': 'application/json',
          ...(user ? getAuthHeader() : {})
        }
      });

      const data = await response.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await fetch(`http://localhost:3001/api/communities/${id}/posts`, {
        headers: {
          'Content-Type': 'application/json',
          ...(user ? getAuthHeader() : {})
        }
      });

      const data = await response.json();
      if (data.success || Array.isArray(data.data)) {
        setPosts(data.data || []);
      } else {
        console.error('Failed to fetch posts:', data);
        setPosts([]);
      }
    } catch (err) {
      console.error('Error fetching community posts:', err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Helper functions for posts
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, maxLength) + '...';
  };

  const handleVotePost = async (postId, voteType) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          user_id: user.id,
          vote_type: voteType
        })
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts to get updated vote counts
      }
    } catch (error) {
      console.error('Error voting on post:', error);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`http://localhost:3001/api/communities/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        if (response.status === 202) {
          alert('Join request submitted! Waiting for approval.');
        } else {
          alert('Successfully joined the community!');
        }
        fetchCommunity(); // Refresh to update user status
      } else {
        alert(data.error || 'Failed to join community');
      }
    } catch (err) {
      console.error('Error joining community:', err);
      alert('Failed to join community');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!confirm('Are you sure you want to leave this community?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`http://localhost:3001/api/communities/${id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Successfully left the community');
        fetchCommunity(); // Refresh to update user status
      } else {
        alert(data.error || 'Failed to leave community');
      }
    } catch (err) {
      console.error('Error leaving community:', err);
      alert('Failed to leave community');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinSubClub = async (subClubId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/sub-clubs/${subClubId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        if (response.status === 202) {
          alert('Join request submitted! Waiting for approval.');
        } else {
          alert('Successfully joined the sub-club!');
        }
        fetchCommunity(); // Refresh to update sub-club status
      } else {
        alert(data.error || 'Failed to join sub-club');
      }
    } catch (err) {
      console.error('Error joining sub-club:', err);
      alert('Failed to join sub-club');
    }
  };

  const handleLeaveSubClub = async (subClubId) => {
    if (!confirm('Are you sure you want to leave this sub-club?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/sub-clubs/${subClubId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Successfully left the sub-club');
        fetchCommunity(); // Refresh to update sub-club status
      } else {
        alert(data.error || 'Failed to leave sub-club');
      }
    } catch (err) {
      console.error('Error leaving sub-club:', err);
      alert('Failed to leave sub-club');
    }
  };

  const getUserActionButton = () => {
    if (!user) {
      return (
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Login to Join
        </button>
      );
    }

    if (community.user_role === 'creator' || community.user_role === 'moderator' || community.user_role === 'member') {
      return (
        <button
          onClick={handleLeaveCommunity}
          disabled={actionLoading || community.user_role === 'creator'}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {community.user_role === 'creator' ? 'Creator (Cannot Leave)' : 'Leave Community'}
        </button>
      );
    }

    if (community.join_request_status === 'pending') {
      return (
        <button
          disabled
          className="bg-yellow-500 text-white px-6 py-2 rounded-lg opacity-75 cursor-not-allowed"
        >
          Request Pending
        </button>
      );
    }

    return (
      <button
        onClick={handleJoinCommunity}
        disabled={actionLoading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {actionLoading ? 'Joining...' : 'Join Community'}
      </button>
    );
  };

  const getSubClubActionButton = (subClub) => {
    if (!user) {
      return (
        <button
          onClick={() => navigate('/login')}
          className="bg-gray-500 text-white px-4 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
        >
          Login to Join
        </button>
      );
    }

    // Must be a member of the community to join sub-clubs
    if (!community.user_role) {
      return (
        <span className="text-sm text-gray-500">
          Join community first
        </span>
      );
    }

    if (subClub.user_role === 'creator' || subClub.user_role === 'moderator' || subClub.user_role === 'member') {
      return (
        <button
          onClick={() => handleLeaveSubClub(subClub.id)}
          disabled={subClub.user_role === 'creator'}
          className="bg-red-500 text-white px-4 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {subClub.user_role === 'creator' ? 'Creator' : 'Leave'}
        </button>
      );
    }

    if (subClub.join_request_status === 'pending') {
      return (
        <button
          disabled
          className="bg-yellow-500 text-white px-4 py-1 rounded text-sm opacity-75 cursor-not-allowed"
        >
          Pending
        </button>
      );
    }

    return (
      <button
        onClick={() => handleJoinSubClub(subClub.id)}
        className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
      >
        Join
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-6"></div>
              <div className="h-32 bg-gray-300 rounded mb-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/communities')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Communities
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-600 mb-4">Community Not Found</h1>
              <button
                onClick={() => navigate('/communities')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Communities
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Community Header */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  community.visibility === 'public' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {community.visibility === 'public' ? 'Public' : 'Private'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  community.type === 'agnostic' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {community.type === 'agnostic' ? 'Location Agnostic' : 'Location Bound'}
                </span>
              </div>
              
              {community.description && (
                <p className="text-gray-600 mb-4">{community.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                <span>👤 Created by {community.creator_name}</span>
                <span>👥 {community.actual_member_count || community.member_count} members</span>
                <span>📅 {new Date(community.created_at).toLocaleDateString()}</span>
                {community.location && (
                  <span>📍 {community.location}</span>
                )}
              </div>

              {community.tags && community.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {community.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {getUserActionButton()}
              
              {/* Debug Button - Temporary */}
              {user && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`http://localhost:3001/api/communities/${id}/debug-membership`, {
                        headers: {
                          'Content-Type': 'application/json',
                          ...getAuthHeader()
                        }
                      });
                      const data = await response.json();
                      console.log('Debug membership data:', data);
                      alert('Check console for membership debug info');
                    } catch (err) {
                      console.error('Debug error:', err);
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  🐛 Debug Membership
                </button>
              )}
              
              {/* Create Post Button for Members */}
              {console.log('🎯 Create Post Debug:', {
                userRole: community.user_role,
                user: user,
                canCreatePost: community.user_role && ['creator', 'moderator', 'member'].includes(community.user_role)
              })}
              
              {community.user_role && ['creator', 'moderator', 'member'].includes(community.user_role) ? (
                <Link
                  to={`/communities/${id}/create-post`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm text-center inline-flex items-center justify-center shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Post
                </Link>
              ) : user && !community.user_role ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-yellow-700">
                        Join this community to create posts and participate in discussions.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              
              {(community.user_role === 'creator' || community.user_role === 'moderator') && (
                <div className="flex gap-2">
                  <Link
                    to={`/communities/${id}/edit`}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      setShowMembers(!showMembers);
                      if (!showMembers) fetchMembers();
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    {showMembers ? 'Hide Members' : 'View Members'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Members Management (for creators/moderators) */}
        {showMembers && (community.user_role === 'creator' || community.user_role === 'moderator') && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Community Members</h3>
            {members.length === 0 ? (
              <p className="text-gray-500">No members found.</p>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{member.username}</span>
                      <span className={`ml-3 px-2 py-1 rounded text-xs ${
                        member.role === 'creator' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Community Posts Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Community Posts</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPosts(!showPosts)}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                {showPosts ? 'Hide Posts' : 'Show Posts'}
              </button>
              {community.user_role && ['creator', 'moderator', 'member'].includes(community.user_role) ? (
                <Link
                  to={`/communities/${id}/create-post`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center text-sm shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Post
                </Link>
              ) : (
                <div className="text-sm">
                  {!user ? (
                    <Link to="/login" className="text-blue-600 hover:text-blue-800 underline font-medium">
                      Login to post
                    </Link>
                  ) : !community.user_role ? (
                    <span className="text-amber-600 font-medium">
                      Join community to post
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      Cannot post
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {showPosts && (
            <div>
              {postsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Be the first to share something with this community!</p>
                    
                    {community.user_role && ['creator', 'moderator', 'member'].includes(community.user_role) ? (
                      <div className="mt-6">
                        <Link
                          to={`/communities/${id}/create-post`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create the first post
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-blue-800 font-medium mb-2">Want to post here?</p>
                          <p className="text-blue-600 text-sm mb-3">Join this community to start creating posts and engaging with other members!</p>
                          {!user ? (
                            <Link
                              to="/login"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Login to Join
                            </Link>
                          ) : !community.user_role ? (
                            <button
                              onClick={handleJoinCommunity}
                              disabled={actionLoading}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                            >
                              {actionLoading ? 'Joining...' : 'Join Community'}
                            </button>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Posts will appear here once members start sharing content.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Link 
                            to={`/post/${post.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <span>By {post.author_name}</span>
                            <span className="mx-2">•</span>
                            <span>{formatTimeAgo(post.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {truncateContent(post.content)}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Voting */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleVotePost(post.id, 'upvote')}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                              disabled={!user}
                            >
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                              {(post.upvotes || 0) - (post.downvotes || 0)}
                            </span>
                            <button
                              onClick={() => handleVotePost(post.id, 'downvote')}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                              disabled={!user}
                            >
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Comments */}
                          <div className="flex items-center space-x-1 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm">{post.comment_count || 0}</span>
                          </div>
                          
                          {/* Shares */}
                          <div className="flex items-center space-x-1 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            <span className="text-sm">{post.share_count || 0}</span>
                          </div>
                        </div>
                        
                        <Link
                          to={`/post/${post.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sub-Clubs Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Sub-Clubs</h2>
            {community.user_role && (
              <Link
                to={`/communities/${id}/create-subclub`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Sub-Club
              </Link>
            )}
          </div>

          {/* Debug Info for SubClubs */}
          {console.log('🏢 SubClubs Debug:', {
            subClubs: community.sub_clubs,
            length: community.sub_clubs?.length,
            isEmpty: !community.sub_clubs || community.sub_clubs.length === 0
          })}

          {(!community.sub_clubs || community.sub_clubs.length === 0) ? (
            <div className="text-center py-8">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sub-clubs yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a specialized sub-club for this community.</p>
                {community.user_role ? (
                  <div className="mt-6">
                <Link
                  to={`/communities/${id}/create-subclub`}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create the first sub-club
                </Link>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">
                    {!user ? (
                      <Link to="/login" className="text-blue-600 hover:text-blue-800 underline">
                        Login
                      </Link>
                    ) : (
                      "Join this community"
                    )} to create sub-clubs
                  </p>
              )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                Found {community.sub_clubs.length} sub-club{community.sub_clubs.length !== 1 ? 's' : ''}
              </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {community.sub_clubs.map(subClub => (
                  <div key={subClub.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{subClub.name}</h3>
                    <div className="flex gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                        subClub.visibility === 'public' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {subClub.visibility}
                      </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                        subClub.type === 'agnostic' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {subClub.type === 'agnostic' ? 'Agnostic' : 'Location Bound'}
                      </span>
                    </div>
                  </div>
                  
                  {subClub.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{subClub.description}</p>
                  )}

                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                        </svg>
                        {subClub.actual_member_count || subClub.member_count || 0} members
                      </span>
                      <span className="text-xs">By {subClub.creator_name}</span>
                  </div>

                  {subClub.location && (
                      <p className="text-sm text-gray-500 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                        {subClub.location}
                      </p>
                  )}

                  <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                    <Link
                          to={`/subclubs/${subClub.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                    >
                      View Details
                    </Link>
                        {subClub.user_role && (
                          <Link
                            to={`/subclubs/${subClub.id}/create-post`}
                            className="text-green-600 hover:text-green-800 text-sm font-medium underline"
                          >
                            Create Post
                          </Link>
                        )}
                      </div>
                    {getSubClubActionButton(subClub)}
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
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

export default CommunityDetail; 