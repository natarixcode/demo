// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';

/**
 * Enhanced Home Page Component with iOS 17 Design
 * Features:
 * - Glassmorphism cards with beautiful styling
 * - Real-time post data from API
 * - Mood system with elegant design
 * - Community showcase
 * - Responsive layout with smooth animations
 */
const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mood data with iOS-inspired styling
  const moods = [
    { id: 1, emoji: '😊', label: 'Happy', color: 'from-iosYellow/20 to-iosOrange/20', border: 'border-iosYellow/30' },
    { id: 2, emoji: '😢', label: 'Sad', color: 'from-iosBlue/20 to-iosTeal/20', border: 'border-iosBlue/30' },
    { id: 3, emoji: '😎', label: 'Cool', color: 'from-iosPurple/20 to-iosIndigo/20', border: 'border-iosPurple/30' },
    { id: 4, emoji: '🤔', label: 'Thoughtful', color: 'from-iosGreen/20 to-iosTeal/20', border: 'border-iosGreen/30' },
    { id: 5, emoji: '😴', label: 'Tired', color: 'from-iosGray-400/20 to-iosGray-500/20', border: 'border-iosGray-400/30' },
    { id: 6, emoji: '🎉', label: 'Excited', color: 'from-iosPink/20 to-iosRed/20', border: 'border-iosPink/30' }
  ];

  // Featured communities with beautiful gradients
  const featuredCommunities = [
    {
      id: 1,
      name: 'Tech Innovators',
      icon: '💻',
      members: '12.5K',
      description: 'Code, design, innovate',
      online: '2.3K online',
      posts: 1247,
      gradient: 'from-iosBlue/10 to-iosPurple/10',
      iconBg: 'from-iosBlue to-iosPurple'
    },
    {
      id: 2,
      name: 'Creative Minds',
      icon: '🎨',
      members: '8.9K',
      description: 'Art, design, creativity',
      online: '1.8K online',
      posts: 892,
      gradient: 'from-iosPink/10 to-iosOrange/10',
      iconBg: 'from-iosPink to-iosOrange'
    },
    {
      id: 3,
      name: 'Fitness Enthusiasts',
      icon: '💪',
      members: '15.2K',
      description: 'Health, fitness, wellness',
      online: '3.1K online',
      posts: 2156,
      gradient: 'from-iosGreen/10 to-iosTeal/10',
      iconBg: 'from-iosGreen to-iosTeal'
    },
    {
      id: 4,
      name: 'Food Lovers',
      icon: '🍕',
      members: '21.8K',
      description: 'Recipes, restaurants, reviews',
      online: '4.2K online',
      posts: 3421,
      gradient: 'from-iosOrange/10 to-iosYellow/10',
      iconBg: 'from-iosOrange to-iosYellow'
    }
  ];

  // Fetch posts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/posts');
      const data = await response.json();
      
      if (data.data) {
        setPosts(data.data.slice(0, 6)); // Show latest 6 posts
      }
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle voting on posts
  const handleVote = async (postId, voteType) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/vote`, {
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
        fetchPosts(); // Refresh the posts data
      } else {
        toast.error('Failed to record vote');
      }
    } catch (error) {
      toast.error('Error voting on post');
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-iosGray-50 via-white to-iosGray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-iosGray-900 mb-2">
                  {isAuthenticated ? `Welcome back, ${user?.username}!` : 'Welcome to Natarix'}
                </h1>
                <p className="text-iosGray-600">
                  {isAuthenticated 
                    ? 'Discover what your communities are talking about' 
                    : 'Join communities, share ideas, and connect with people who matter'
                  }
                </p>
              </div>
              {!isAuthenticated && (
                <div className="hidden md:flex space-x-3">
                  <Link
                    to="/register"
                    className="px-6 py-3 bg-iosBlue text-white rounded-xl font-semibold hover:bg-iosBlue/90 transition-all duration-200 shadow-ios"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="px-6 py-3 bg-white/70 backdrop-blur-md text-iosGray-700 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 border border-white/20"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="mb-8 animate-slide-up">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-6">
            <h2 className="text-xl font-semibold text-iosGray-900 mb-4">How are you feeling today?</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                  className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                    selectedMood === mood.id
                      ? `bg-gradient-to-br ${mood.color} ${mood.border} shadow-ios`
                      : 'bg-white/40 border-white/30 hover:bg-white/60'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className="text-xs font-medium text-iosGray-700">{mood.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Latest Posts */}
          <div className="lg:col-span-2 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-iosGray-900">Latest Posts</h2>
              {isAuthenticated && (
                <Link
                  to="/create-post"
                  className="flex items-center space-x-2 px-4 py-2 bg-iosBlue text-white rounded-xl font-medium hover:bg-iosBlue/90 transition-all duration-200 shadow-ios"
                >
                  <span>✍️</span>
                  <span>Create Post</span>
                </Link>
              )}
            </div>

            {loading ? (
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-8 text-center">
                <LoadingSpinner size="lg" text="Loading posts..." />
              </div>
            ) : error ? (
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-8 text-center">
                <div className="text-iosRed text-lg font-semibold mb-2">😔 Oops!</div>
                <p className="text-iosGray-600">{error}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-8 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-iosGray-900 mb-2">No posts yet</h3>
                <p className="text-iosGray-600 mb-4">Be the first to share something with the community!</p>
                {isAuthenticated && (
                  <Link
                    to="/create-post"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-iosBlue text-white rounded-xl font-semibold hover:bg-iosBlue/90 transition-all duration-200 shadow-ios"
                  >
                    <span>✍️</span>
                    <span>Create Your First Post</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-6 hover:shadow-ios-lg transition-all duration-300 group"
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-iosBlue to-iosPurple rounded-full flex items-center justify-center text-white font-semibold">
                          {post.author_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-iosGray-900">{post.author_name}</p>
                          <p className="text-sm text-iosGray-500">{formatTimeAgo(post.created_at)}</p>
                        </div>
                      </div>
                      {post.community_name && (
                        <div className="px-3 py-1 bg-iosBlue/10 text-iosBlue rounded-full text-xs font-medium">
                          {post.community_name}
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-iosGray-900 mb-2">{post.title}</h3>
                      <p className="text-iosGray-700 leading-relaxed">
                        {truncateContent(post.content)}
                      </p>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center space-x-6 text-sm">
                      <button
                        onClick={() => handleVote(post.id, 'upvote')}
                        className="flex items-center space-x-2 text-iosGray-600 hover:text-iosGreen transition-colors duration-200"
                      >
                        <span>👍</span>
                        <span>{post.upvotes || 0}</span>
                      </button>
                      <button
                        onClick={() => handleVote(post.id, 'downvote')}
                        className="flex items-center space-x-2 text-iosGray-600 hover:text-iosRed transition-colors duration-200"
                      >
                        <span>👎</span>
                        <span>{post.downvotes || 0}</span>
                      </button>
                      <Link
                        to={`/post/${post.id}`}
                        className="flex items-center space-x-2 text-iosGray-600 hover:text-iosBlue transition-colors duration-200"
                      >
                        <span>💬</span>
                        <span>{post.comment_count || 0} comments</span>
                      </Link>
                      <button className="flex items-center space-x-2 text-iosGray-600 hover:text-iosPurple transition-colors duration-200">
                        <span>📤</span>
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* View More Button */}
                <div className="text-center">
                  <Link
                    to="/communities"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-white/70 backdrop-blur-md text-iosGray-700 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 border border-white/20"
                  >
                    <span>👀</span>
                    <span>Explore More Posts</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            
            {/* Featured Communities */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-iosGray-900">Featured Communities</h3>
                <Link
                  to="/communities"
                  className="text-sm text-iosBlue hover:text-iosBlue/80 font-medium transition-colors duration-200"
                >
                  View All
                </Link>
              </div>
              
              <div className="space-y-3">
                {featuredCommunities.map((community) => (
                  <div
                    key={community.id}
                    className={`p-4 rounded-xl bg-gradient-to-r ${community.gradient} border border-white/20 hover:shadow-ios transition-all duration-300 cursor-pointer group`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${community.iconBg} rounded-xl flex items-center justify-center text-white text-xl shadow-ios`}>
                        {community.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-iosGray-900 truncate group-hover:text-iosBlue transition-colors duration-200">
                          {community.name}
                        </h4>
                        <p className="text-xs text-iosGray-600 truncate">{community.description}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-iosGray-500">{community.members} members</span>
                          <span className="text-xs text-iosGreen">● {community.online}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/create-community"
                className="block mt-4 p-3 bg-gradient-to-r from-iosBlue/10 to-iosPurple/10 border-2 border-dashed border-iosBlue/30 rounded-xl text-center hover:from-iosBlue/20 hover:to-iosPurple/20 transition-all duration-200 group"
              >
                <div className="text-2xl mb-1">➕</div>
                <p className="text-sm font-medium text-iosBlue group-hover:text-iosBlue/80">Create Community</p>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-glass-sm p-6">
              <h3 className="text-lg font-semibold text-iosGray-900 mb-4">Community Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-iosGray-600">Total Communities</span>
                  <span className="font-semibold text-iosGray-900">1,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-iosGray-600">Active Members</span>
                  <span className="font-semibold text-iosGray-900">52.3K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-iosGray-600">Posts Today</span>
                  <span className="font-semibold text-iosGray-900">834</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-iosGray-600">Online Now</span>
                  <span className="font-semibold text-iosGreen">12.1K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;