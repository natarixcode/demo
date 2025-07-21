// src/pages/PostDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePostInteractions, useVotePost, useCreateComment, useVoteComment, useSharePost } from "../hooks/useApi";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';

/**
 * Post Details Page - Enhanced Glassmorphism Design with Real API Integration
 * Features:
 * - Real-time voting system with database integration
 * - Functional comment system with nested replies
 * - Working share functionality
 * - Author profile integration
 * - Responsive design matching home page
 */
const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  // API hooks for data and interactions
  const { 
    post, 
    comments, 
    userVote, 
    shareStats, 
    loading, 
    error, 
    refetchAll 
  } = usePostInteractions(id, user?.id);

  const { vote, unvote, loading: voteLoading } = useVotePost(id);
  const { execute: createComment, loading: commentLoading } = useCreateComment(id);
  const { share, loading: shareLoading } = useSharePost(id);

  // Handle voting
  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }

    try {
      if (userVote === voteType) {
        // Remove vote if clicking same vote type
        await unvote(user.id);
        toast.success('Vote removed');
      } else {
        // Add or change vote
        await vote(user.id, voteType);
        toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`);
      }
      refetchAll();
    } catch (error) {
      toast.error('Failed to record vote');
      }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !newComment.trim()) {
      toast.error('Please login and enter a comment');
      return;
    }

    try {
      await createComment({
        author: user.id,
        content: newComment.trim(),
        parent_comment_id: null
      });
      
      setNewComment('');
      toast.success('Comment posted successfully');
      refetchAll();
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (parentId) => {
    if (!isAuthenticated || !replyContent.trim()) {
      toast.error('Please login and enter a reply');
      return;
    }

    try {
      await createComment({
        author: user.id,
        content: replyContent.trim(),
        parent_comment_id: parentId
      });
      
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply posted successfully');
      refetchAll();
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  // Handle sharing
  const handleShare = async (shareType = 'link') => {
    if (!isAuthenticated) {
      toast.error('Please login to share');
      return;
    }

    try {
      if (shareType === 'link') {
        // Copy link to clipboard
        const url = `${window.location.origin}/post/${id}`;
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
      
      // Record share in database
      await share(user.id, shareType);
      refetchAll();
    } catch (error) {
      toast.error('Failed to share post');
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

  // Group comments by parent
  const groupedComments = comments.reduce((acc, comment) => {
    if (!comment.parent_comment_id) {
      acc.push({ ...comment, replies: [] });
    } else {
      const parent = acc.find(c => c.id === comment.parent_comment_id);
      if (parent) {
        parent.replies.push(comment);
    }
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading post..." />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h2>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist.</p>
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

    return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 hover:scale-105 transition-all duration-200"
            >
              <span>←</span>
              <span className="font-medium text-gray-900">Back</span>
            </button>
            
            <div className="flex items-center space-x-4">
              {/* Share Button */}
              <button
                onClick={() => handleShare('link')}
                disabled={shareLoading}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-400/20 to-teal-400/20 hover:scale-105 transition-all duration-200 disabled:opacity-50"
          >
                <span>🔗</span>
                <span className="font-medium text-gray-900">Share</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-24 px-4 max-w-4xl mx-auto">
        {/* Post Header */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-glass-fade-in">
          {/* Post Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>
              
          {/* Author Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                {post.author_name?.[0]?.toUpperCase() || '?'}
                  </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{post.author_name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{formatTimeAgo(post.created_at)}</span>
                  {post.is_draft && (
                  <>
                    <span>•</span>
                      <span className="text-orange-600 font-medium">Draft</span>
                  </>
                )}
                </div>
              </div>
            </div>
              </div>

          {/* Voting and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Voting */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={voteLoading}
                  className={`vote-button ${userVote === 'upvote' ? 'bg-green-500 text-white' : 'bg-white/50 text-gray-700 hover:bg-green-100'} disabled:opacity-50`}
                >
                  ↑
                </button>
                <span className="font-bold text-lg text-gray-900">
                  {(post.upvotes || 0) - (post.downvotes || 0)}
                    </span>
                <button
                  onClick={() => handleVote('downvote')}
                  disabled={voteLoading}
                  className={`vote-button ${userVote === 'downvote' ? 'bg-red-500 text-white' : 'bg-white/50 text-gray-700 hover:bg-red-100'} disabled:opacity-50`}
                >
                  ↓
                </button>
              </div>

              {/* Comment Count */}
              <div className="flex items-center space-x-2 text-gray-600">
                <span>💬</span>
                <span>{post.comment_count || 0} comments</span>
              </div>

              {/* Share Count */}
              <div className="flex items-center space-x-2 text-gray-600">
                <span>🔗</span>
                <span>{post.share_count || 0} shares</span>
                </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {post.content}
            </div>
          </div>
        </div>

      {/* Comments Section */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-2">💬</span>
                Comments ({comments.length})
              </h3>

          {/* Add Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="glass-card-secondary rounded-xl p-4 mb-4">
                  <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-500"
                  rows="3"
                />
                </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || commentLoading}
                  className="btn-primary px-6 py-2 disabled:opacity-50"
                >
                  {commentLoading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
              </form>
          ) : (
            <div className="mb-8 p-4 rounded-xl bg-gray-100 text-center">
              <p className="text-gray-600">
                <Link to="/login" className="text-purple-600 hover:underline">
                  Login
                </Link> to post a comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {groupedComments.map((comment) => (
              <div key={comment.id} className="comment-card rounded-xl p-4">
                {/* Comment Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                      {comment.author_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-gray-900">{comment.author_name}</span>
                    <span className="text-sm text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  
                  {/* Comment Voting */}
                  <div className="flex items-center space-x-2">
                    <button className="vote-button bg-white/50 text-gray-700 hover:bg-green-100 text-sm">
                      ↑ {comment.upvotes || 0}
                    </button>
                    <button className="vote-button bg-white/50 text-gray-700 hover:bg-red-100 text-sm">
                      ↓ {comment.downvotes || 0}
                    </button>
                  </div>
              </div>

                {/* Comment Content */}
                <p className="text-gray-800 mb-3 leading-relaxed">
                  {comment.content}
                </p>

                {/* Comment Actions */}
                <div className="flex items-center space-x-4">
                  {isAuthenticated && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Reply
                    </button>
                  )}
              </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 ml-6">
                    <div className="glass-card-secondary rounded-xl p-3 mb-3">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-500"
                        rows="2"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="btn-secondary px-4 py-1 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={!replyContent.trim() || commentLoading}
                        className="btn-primary px-4 py-1 text-sm disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-6 space-y-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="comment-card rounded-xl p-3 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center text-white font-bold text-xs">
                              {reply.author_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{reply.author_name}</span>
                            <span className="text-xs text-gray-500">{formatTimeAgo(reply.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button className="vote-button bg-white/50 text-gray-700 hover:bg-green-100 text-xs">
                              ↑ {reply.upvotes || 0}
                            </button>
                            <button className="vote-button bg-white/50 text-gray-700 hover:bg-red-100 text-xs">
                              ↓ {reply.downvotes || 0}
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                  </div>
                ))}

            {comments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetails;