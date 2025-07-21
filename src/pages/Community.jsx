import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Community Page - Individual Subreddit
 * Features:
 * - Community header with info and join button
 * - Community posts with filtering
 * - Community rules and description
 * - Moderator information
 * - Post creation within community
 */
const Community = () => {
  const { communityName } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("hot");
  const [votedPosts, setVotedPosts] = useState({});
  const [isJoined, setIsJoined] = useState(false);

  // Mock community data
  const community = {
    name: communityName,
    displayName: communityName.charAt(0).toUpperCase() + communityName.slice(1),
    description: "A community for discussing " + communityName + " related topics, sharing knowledge, and connecting with like-minded individuals.",
    members: 125000,
    online: 2340,
    createdAt: "2020-03-15T10:30:00Z",
    icon: "💻",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=300&fit=crop",
    rules: [
      "Be respectful and civil",
      "No spam or self-promotion",
      "Stay on topic",
      "No personal attacks",
      "Follow Reddit's content policy"
    ],
    moderators: [
      { username: "mod1", karma: 45000, isVerified: true },
      { username: "mod2", karma: 32000, isVerified: true },
      { username: "mod3", karma: 28000, isVerified: false }
    ]
  };

  // Mock posts for this community
  const posts = [
    {
      id: 1,
      title: "What's your favorite " + communityName + " tip?",
      content: "I've been working with " + communityName + " for a while now and I'm always looking for new tips and tricks. What's your favorite tip that you think everyone should know?",
      author: { username: "user123", karma: 15420, isVerified: false },
      community: communityName,
      createdAt: "2024-01-15T10:30:00Z",
      upvotes: 1247,
      downvotes: 23,
      commentCount: 89,
      awards: ["gold"],
      isStickied: false,
      isLocked: false,
      flair: "Discussion",
      imageUrl: null,
      isNSFW: false
    },
    {
      id: 2,
      title: "Just completed my first " + communityName + " project!",
      content: "After months of learning, I finally finished my first project using " + communityName + ". Here's what I built and what I learned along the way...",
      author: { username: "newbie", karma: 1200, isVerified: false },
      community: communityName,
      createdAt: "2024-01-15T08:15:00Z",
      upvotes: 892,
      downvotes: 15,
      commentCount: 156,
      awards: ["silver"],
      isStickied: false,
      isLocked: false,
      flair: "Showcase",
      imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
      isNSFW: false
    },
    {
      id: 3,
      title: "Weekly " + communityName + " discussion thread",
      content: "Welcome to this week's discussion thread! Feel free to ask questions, share your experiences, or discuss anything " + communityName + " related.",
      author: { username: "mod1", karma: 45000, isVerified: true },
      community: communityName,
      createdAt: "2024-01-15T06:45:00Z",
      upvotes: 2156,
      downvotes: 67,
      commentCount: 234,
      awards: ["gold", "platinum"],
      isStickied: true,
      isLocked: false,
      flair: "Discussion",
      imageUrl: null,
      isNSFW: false
    }
  ];

  /**
   * Handle post upvote
   */
  const handlePostUpvote = (postId) => {
    if (!isAuthenticated) {
      alert("Please login to vote");
      return;
    }
    
    setVotedPosts(prev => {
      const currentVote = prev[postId];
      if (currentVote === 'upvote') {
        const newVotes = { ...prev };
        delete newVotes[postId];
        return newVotes;
      } else {
        return { ...prev, [postId]: 'upvote' };
      }
    });
  };

  /**
   * Handle post downvote
   */
  const handlePostDownvote = (postId) => {
    if (!isAuthenticated) {
      alert("Please login to vote");
      return;
    }
    
    setVotedPosts(prev => {
      const currentVote = prev[postId];
      if (currentVote === 'downvote') {
        const newVotes = { ...prev };
        delete newVotes[postId];
        return newVotes;
      } else {
        return { ...prev, [postId]: 'downvote' };
      }
    });
  };

  /**
   * Get post vote count
   */
  const getPostVoteCount = (post) => {
    const baseCount = (post.upvotes || 0) - (post.downvotes || 0);
    const userVote = votedPosts[post.id];
    
    if (userVote === 'upvote') {
      return baseCount + 1;
    } else if (userVote === 'downvote') {
      return baseCount - 1;
    }
    return baseCount;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  /**
   * Format number with K/M suffix
   */
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  /**
   * Filter posts based on selected filter
   */
  const filteredPosts = useMemo(() => {
    let sorted = [...posts];
    
    switch (selectedFilter) {
      case 'hot':
        return sorted.sort((a, b) => getPostVoteCount(b) - getPostVoteCount(a));
      case 'new':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'top':
        return sorted.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      case 'rising':
        return sorted.sort((a, b) => b.commentCount - a.commentCount);
      default:
        return sorted;
    }
  }, [posts, selectedFilter, votedPosts]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Community Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="relative">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-red-500 to-red-600">
            <img 
              src={community.banner} 
              alt="Community banner" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Community Info */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end space-x-4 -mt-8 pb-4">
              {/* Community Icon */}
              <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-4xl">{community.icon}</span>
              </div>
              
              {/* Community Details */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">r/{community.name}</h1>
                <p className="text-gray-600">{community.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>{formatNumber(community.members)} members</span>
                  <span>•</span>
                  <span>{formatNumber(community.online)} online</span>
                  <span>•</span>
                  <span>Created {formatDate(community.createdAt)}</span>
                </div>
              </div>
              
              {/* Join Button */}
              <div className="flex items-center space-x-2">
                {isAuthenticated && (
                  <button
                    onClick={() => setIsJoined(!isJoined)}
                    className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 ${
                      isJoined
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isJoined ? 'Joined' : 'Join'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Content - Posts */}
          <div className="lg:col-span-3">
            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                {[
                  { key: 'hot', label: 'Hot', icon: '🔥' },
                  { key: 'new', label: 'New', icon: '🆕' },
                  { key: 'top', label: 'Top', icon: '📈' },
                  { key: 'rising', label: 'Rising', icon: '📈' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key)}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                      selectedFilter === filter.key
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{filter.icon}</span>
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Post Button */}
            {isAuthenticated && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <Link
                  to={`/r/${communityName}/submit`}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors duration-200 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-semibold text-sm">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-gray-500">Create Post</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  {/* Post Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">Posted by u/{post.author.username}</span>
                      <span className="text-gray-400">•</span>
                      <time className="text-xs text-gray-500">{formatDate(post.createdAt)}</time>
                      {post.isStickied && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Stickied</span>
                        </>
                      )}
                    </div>
                    
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      <Link to={`/r/${post.community}/comments/${post.id}`} className="hover:text-red-600 transition-colors duration-200">
                        {post.title}
                      </Link>
                    </h2>
                    
                    {post.flair && (
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mb-3">
                        {post.flair}
                      </span>
                    )}
                    
                    {post.content && (
                      <p className="text-gray-700 text-sm leading-relaxed mb-3 line-clamp-3">
                        {post.content}
                      </p>
                    )}
                    
                    {post.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={post.imageUrl} 
                          alt="Post content" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Upvote */}
                      <button
                        onClick={() => handlePostUpvote(post.id)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors duration-200 ${
                          votedPosts[post.id] === 'upvote'
                            ? 'text-orange-500'
                            : 'text-gray-500 hover:text-orange-500'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Vote Count */}
                      <span className="text-sm font-medium text-gray-900">
                        {formatNumber(getPostVoteCount(post))}
                      </span>

                      {/* Downvote */}
                      <button
                        onClick={() => handlePostDownvote(post.id)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors duration-200 ${
                          votedPosts[post.id] === 'downvote'
                            ? 'text-blue-500'
                            : 'text-gray-500 hover:text-blue-500'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Comments */}
                      <Link
                        to={`/r/${post.community}/comments/${post.id}`}
                        className="flex items-center space-x-1 px-2 py-1 rounded text-gray-500 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-sm">{formatNumber(post.commentCount)} Comments</span>
                      </Link>

                      {/* Share */}
                      <button className="flex items-center space-x-1 px-2 py-1 rounded text-gray-500 hover:bg-gray-100 transition-colors duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <span className="text-sm">Share</span>
                      </button>

                      {/* Save */}
                      <button className="flex items-center space-x-1 px-2 py-1 rounded text-gray-500 hover:bg-gray-100 transition-colors duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span className="text-sm">Save</span>
                      </button>
                    </div>

                    {/* Awards */}
                    {post.awards.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {post.awards.map((award, index) => (
                          <span key={index} className="text-yellow-500 text-sm">🏆</span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              
              {/* Community Rules */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Community Rules</h3>
                </div>
                <div className="p-4">
                  <ol className="space-y-2 text-sm text-gray-700">
                    {community.rules.map((rule, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-red-600 font-medium">{index + 1}.</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Moderators */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Moderators</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {community.moderators.map((mod, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-semibold text-xs">
                            {mod.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">u/{mod.username}</span>
                        {mod.isVerified && (
                          <span className="text-blue-500 text-xs">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Community Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Community Stats</h3>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Members</span>
                    <span className="font-medium">{formatNumber(community.members)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Online</span>
                    <span className="font-medium">{formatNumber(community.online)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">{formatDate(community.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community; 