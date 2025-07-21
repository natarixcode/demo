// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts, useVotePost, useSharePost } from "../hooks/useApi";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';

/**
 * Enhanced Home Page Component with Real API Integration
 * Features:
 * - Real-time post data from API
 * - Functional voting system
 * - Working share functionality
 * - Beautiful glassmorphism design
 * - Responsive layout
 */
const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(null);

  // API hooks for real data
  const { posts, loading, error, refetch } = usePosts(false); // Don't include drafts

  // Mood data (keeping this as UI state)
  const moods = [
    { id: 1, emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-400' },
    { id: 2, emoji: '😢', label: 'Sad', color: 'from-blue-400 to-indigo-400' },
    { id: 3, emoji: '😎', label: 'Cool', color: 'from-purple-400 to-pink-400' },
    { id: 4, emoji: '🤔', label: 'Thoughtful', color: 'from-green-400 to-teal-400' },
    { id: 5, emoji: '😴', label: 'Tired', color: 'from-gray-400 to-slate-400' },
    { id: 6, emoji: '🎉', label: 'Excited', color: 'from-red-400 to-pink-400' }
  ];

  // Communities data (mock for now, will be real later)
  const communities = [
    {
      id: 1,
      name: 'Programming',
      icon: '💻',
      members: '125K',
      description: 'Code, debug, repeat',
      online: '2.3K online',
      posts: 1247,
      gradient: 'from-blue-400/20 to-purple-400/20'
    },
    {
      id: 2,
      name: 'Design',
      icon: '🎨',
      members: '89K',
      description: 'Pixels and creativity',
      online: '1.8K online',
      posts: 892,
      gradient: 'from-pink-400/20 to-orange-400/20'
    },
    {
      id: 3,
      name: 'Gaming',
      icon: '🎮',
      members: '210K',
      description: 'Level up together',
      online: '5.1K online',
      posts: 2156,
      gradient: 'from-green-400/20 to-blue-400/20'
    },
    {
      id: 4,
      name: 'Science',
      icon: '🔬',
      members: '67K',
      description: 'Discover the unknown',
      online: '892 online',
      posts: 734,
      gradient: 'from-purple-400/20 to-pink-400/20'
    }
  ];

  // Handle voting on posts
  const handleVote = async (postId, voteType) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          vote_type: voteType
        })
      });

      if (response.ok) {
        toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`);
        refetch(); // Refresh the posts data
      } else {
        toast.error('Failed to record vote');
      }
    } catch (error) {
      toast.error('Error voting on post');
    }
  };

  // Handle sharing posts
  const handleShare = async (postId, shareType = 'link') => {
    if (!isAuthenticated) {
      toast.error('Please login to share');
      return;
    }

    try {
      // Copy link to clipboard
      const url = `${window.location.origin}/post/${postId}`;
      await navigator.clipboard.writeText(url);
      
      // Record share in database
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          share_type: shareType
        })
      });

      if (response.ok) {
        toast.success('Link copied to clipboard!');
        refetch(); // Refresh the posts data
      } else {
        toast.error('Failed to share post');
      }
    } catch (error) {
      toast.error('Error sharing post');
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, maxLength) + '...';
  };

  // Sort posts by vote score and recency for trending
  const getTrendingPosts = () => {
    return posts
      .map(post => ({
        ...post,
        score: (post.upvotes || 0) - (post.downvotes || 0)
      }))
      .sort((a, b) => {
        // Sort by score first, then by recency
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.created_at) - new Date(a.created_at);
      })
      .slice(0, 5); // Top 5 trending posts
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading posts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">Unable to load posts. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="btn-primary px-6 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const trendingPosts = getTrendingPosts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <main className="pt-20 pb-24 px-4 max-w-6xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          {isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Welcome back, <span className="text-purple-600">{user?.username}!</span>
                  </h1>
                  <p className="text-sm text-gray-600">What's on your mind today?</p>
                </div>
              </div>
              <Link
                to="/create-post"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Create Post
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Welcome to <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Natarix</span>
              </h1>
              <p className="text-gray-600 mb-6">Connect, share, and discover amazing content with our community</p>
              <div className="flex items-center justify-center space-x-4">
                <Link to="/register" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                  Join Now
                </Link>
                <Link to="/login" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200">
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Mood & Communities */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-100 shadow-sm p-6 animate-slide-up">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Posts</span>
                  <span className="font-semibold text-purple-600">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="font-semibold text-green-600">1.2k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Communities</span>
                  <span className="font-semibold text-blue-600">15</span>
                </div>
              </div>
            </div>

            {/* Popular Communities */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-100 shadow-sm p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Popular Communities</h3>
                <Link 
                  to="/communities" 
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  View all
                </Link>
              </div>
              
              <div className="space-y-3">
                {communities.slice(0, 5).map((community, index) => (
                  <Link
                    key={community.id}
                    to={`/community/${community.name.toLowerCase()}`}
                    className="group flex items-center p-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-semibold text-sm">{community.icon}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm group-hover:text-purple-600 transition-colors duration-200">
                        {community.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {community.members} • {community.posts} posts
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  to="/communities"
                  className="block w-full py-2 px-4 text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Explore More Communities
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content - Trending Posts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-gray-100 shadow-sm p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Trending Posts</h2>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full">Hot</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-full">New</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-full">Top</button>
                </div>
              </div>

              {trendingPosts.length > 0 ? (
                <div className="space-y-4">
                  {trendingPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="bg-gray-50/50 rounded-xl p-4 hover:bg-gray-100/50 transition-all duration-200"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Voting Section */}
                        <div className="flex flex-col items-center space-y-2 min-w-[50px]">
                          <button
                            onClick={() => handleVote(post.id, 'upvote')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <span className="text-sm font-semibold text-gray-900">
                            {(post.upvotes || 0) - (post.downvotes || 0)}
                          </span>
                          <button
                            onClick={() => handleVote(post.id, 'downvote')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Post Content */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/post/${post.id}`}
                            className="group"
                          >
                            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-200">
                              {post.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                              {truncateContent(post.content)}
                            </p>
                          </Link>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center space-x-3">
                              <span className="text-purple-600 font-medium">by {post.author_name}</span>
                              <span>{formatTimeAgo(post.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-sm">{post.comment_count || 0}</span>
                              </button>
                              <button
                                onClick={() => handleShare(post.id)}
                                className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                                <span className="text-sm">{post.share_count || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No posts available yet.</p>
                  {isAuthenticated && (
                    <Link
                      to="/create-post"
                      className="btn-primary px-6 py-2 mt-4 inline-block"
                    >
                      Create the first post!
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* User Dashboard for Authenticated Users */}
            {isAuthenticated && (
              <div className="glass-card rounded-2xl p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <span className="mr-2">⚡</span>
                    Your Dashboard
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Online</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/create-post"
                    className="vibe-button bg-gradient-to-r from-purple-400/20 to-blue-400/20 p-4 rounded-xl text-center hover:scale-105 transition-all duration-200"
                  >
                    <div className="text-2xl mb-2">✨</div>
                    <div className="font-medium text-gray-900">Create Post</div>
                  </Link>
                  <Link
                    to={`/user/${user?.id}`}
                    className="vibe-button bg-gradient-to-r from-green-400/20 to-teal-400/20 p-4 rounded-xl text-center hover:scale-105 transition-all duration-200"
                  >
                    <div className="text-2xl mb-2">📝</div>
                    <div className="font-medium text-gray-900">My Profile</div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;