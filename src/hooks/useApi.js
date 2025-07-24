import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = 'http://localhost:3001';

// Generic API hook with caching and request cancellation
export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const { 
    immediate = true, 
    cacheTime = 5 * 60 * 1000, // 5 minutes
    dependencies = [] 
  } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${API_BASE_URL}${url}`, {
        signal: abortControllerRef.current.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        console.error('API Error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, ...dependencies]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, immediate]);

  return { data, loading, error, refetch: fetchData };
};

// POST request hook
export const usePost = (url, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (body = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      setError(err);
      console.error('POST Error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [url, options.headers]);

  return { execute, loading, error, data };
};

// PUT request hook
export const usePut = (url, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (body = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      setError(err);
      console.error('PUT Error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [url, options.headers]);

  return { execute, loading, error, data };
};

// DELETE request hook
export const useDelete = (url, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (body = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      setError(err);
      console.error('DELETE Error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [url, options.headers]);

  return { execute, loading, error, data };
};

// ================================
// SPECIALIZED HOOKS FOR POSTS
// ================================

// Posts hook with enhanced features
export const usePosts = (includeDrafts = false) => {
  const { data, loading, error, refetch } = useApi(
    `/api/posts?drafts=${includeDrafts}`,
    { immediate: true }
  );

  return {
    posts: data?.data || [],
    loading,
    error,
    refetch,
    count: data?.count || 0
  };
};

// Single post hook
export const useSinglePost = (postId) => {
  const { data, loading, error, refetch } = useApi(
    postId ? `/api/posts/${postId}` : null,
    { immediate: !!postId }
  );

  return {
    post: data?.data || null,
    loading,
    error,
    refetch
  };
};

// Create post hook
export const useCreatePost = () => {
  return usePost('/api/posts');
};

// Update post hook
export const useUpdatePost = (postId) => {
  return usePut(`/api/posts/${postId}`);
};

// Delete post hook
export const useDeletePost = (postId) => {
  return useDelete(`/api/posts/${postId}`);
};

// Publish draft hook
export const usePublishPost = (postId) => {
  return usePut(`/api/posts/${postId}/publish`);
};

// ================================
// VOTING HOOKS
// ================================

// Vote on post hook
export const useVotePost = (postId) => {
  const votePost = usePost(`/api/posts/${postId}/vote`);
  const removeVote = useDelete(`/api/posts/${postId}/vote`);

  const vote = useCallback(async (userId, voteType) => {
    return await votePost.execute({ user_id: userId, vote_type: voteType });
  }, [votePost]);

  const unvote = useCallback(async (userId) => {
    return await removeVote.execute({ user_id: userId });
  }, [removeVote]);

  return {
    vote,
    unvote,
    loading: votePost.loading || removeVote.loading,
    error: votePost.error || removeVote.error
  };
};

// Get user vote hook
export const useUserVote = (postId, userId) => {
  const { data, loading, error, refetch } = useApi(
    postId && userId ? `/api/posts/${postId}/vote/${userId}` : null,
    { immediate: !!(postId && userId) }
  );

  return {
    userVote: data?.data?.vote_type || null,
    loading,
    error,
    refetch
  };
};

// Vote on comment hook
export const useVoteComment = (commentId) => {
  const voteComment = usePost(`/api/comments/${commentId}/vote`);

  const vote = useCallback(async (userId, voteType) => {
    return await voteComment.execute({ user_id: userId, vote_type: voteType });
  }, [voteComment]);

  return {
    vote,
    loading: voteComment.loading,
    error: voteComment.error
  };
};

// ================================
// COMMENT HOOKS
// ================================

// Comments for post hook
export const useComments = (postId) => {
  const { data, loading, error, refetch } = useApi(
    postId ? `/api/posts/${postId}/comments` : null,
    { immediate: !!postId }
  );

  return {
    comments: data?.data || [],
    loading,
    error,
    refetch,
    count: data?.count || 0
  };
};

// Create comment hook
export const useCreateComment = (postId) => {
  return usePost(`/api/posts/${postId}/comments`);
};

// Update comment hook
export const useUpdateComment = (commentId) => {
  return usePut(`/api/comments/${commentId}`);
};

// Delete comment hook
export const useDeleteComment = (commentId) => {
  return useDelete(`/api/comments/${commentId}`);
};

// ================================
// SHARE HOOKS
// ================================

// Share post hook
export const useSharePost = (postId) => {
  const sharePost = usePost(`/api/posts/${postId}/share`);

  const share = useCallback(async (userId, shareType = 'link') => {
    return await sharePost.execute({ user_id: userId, share_type: shareType });
  }, [sharePost]);

  return {
    share,
    loading: sharePost.loading,
    error: sharePost.error
  };
};

// Get share statistics hook
export const useShareStats = (postId) => {
  const { data, loading, error, refetch } = useApi(
    postId ? `/api/posts/${postId}/shares` : null,
    { immediate: !!postId }
  );

  return {
    shareStats: data?.data || [],
    loading,
    error,
    refetch
  };
};

// ================================
// COMBINED HOOKS FOR COMPLEX OPERATIONS
// ================================

// Post with interactions hook (votes, comments, shares)
export const usePostInteractions = (postId, userId) => {
  const { post, loading: postLoading, error: postError, refetch: refetchPost } = useSinglePost(postId);
  const { comments, loading: commentsLoading, refetch: refetchComments } = useComments(postId);
  const { userVote, refetch: refetchVote } = useUserVote(postId, userId);
  const { shareStats, refetch: refetchShares } = useShareStats(postId);

  const refetchAll = useCallback(() => {
    refetchPost();
    refetchComments();
    refetchVote();
    refetchShares();
  }, [refetchPost, refetchComments, refetchVote, refetchShares]);

  return {
    post,
    comments,
    userVote,
    shareStats,
    loading: postLoading || commentsLoading,
    error: postError,
    refetchAll
  };
};

// Draft management hook
export const useDraftManager = (userId) => {
  const { posts: drafts, loading, error, refetch } = usePosts(true);
  const createDraft = useCreatePost();
  const updateDraft = useUpdatePost();
  const publishDraft = usePublishPost();
  const deleteDraft = useDeletePost();

  const userDrafts = drafts.filter(post => 
    post.is_draft && post.author_id === userId
  );

  const saveDraft = useCallback(async (postData) => {
    return await createDraft.execute({ ...postData, is_draft: true });
  }, [createDraft]);

  return {
    drafts: userDrafts,
    loading,
    error,
    refetch,
    saveDraft,
    updateDraft: updateDraft.execute,
    publishDraft: publishDraft.execute,
    deleteDraft: deleteDraft.execute
  };
}; 