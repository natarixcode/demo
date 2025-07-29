// backend/start-server-stable.js - Stable Server Startup
const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./db');
const BadgeService = require('./services/BadgeService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running successfully' 
  });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Posts endpoint
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        u.username as author_name,
        c.name as community_name
      FROM posts p
      LEFT JOIN users u ON p.author = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    
    res.json({
      message: 'Posts retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch posts',
      details: error.message 
    });
  }
});

// Create post endpoint
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, community_id, sub_club_id, is_draft = false } = req.body;
    const author = req.headers['x-user-id'] || 1; // Default to user 1 for demo
    
    const result = await pool.query(`
      INSERT INTO posts (title, content, author, community_id, sub_club_id, is_draft)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, content, author, community_id || null, sub_club_id || null, is_draft]);
    
    // Trigger badge evaluation for post creation
    BadgeService.onPostCreated(author, result.rows[0]).catch(console.error);
    
    res.json({
      success: true,
      message: 'Post created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      error: 'Failed to create post',
      details: error.message 
    });
  }
});

// Get single post endpoint
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.*,
        u.username as author_name,
        c.name as community_name,
        COALESCE(p.upvotes, 0) as upvotes,
        COALESCE(p.downvotes, 0) as downvotes
      FROM posts p
      LEFT JOIN users u ON p.author = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Post retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ 
      error: 'Failed to fetch post',
      details: error.message 
    });
  }
});

// Vote on post endpoint
app.post('/api/posts/:postId/vote/:userId', async (req, res) => {
  try {
    const { postId, userId } = req.params;
    const { vote_type } = req.body; // 'upvote' or 'downvote'
    
    // Check if user already voted
    const existingVote = await pool.query(
      'SELECT * FROM post_votes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    
    if (existingVote.rows.length > 0) {
      // Update existing vote
      await pool.query(
        'UPDATE post_votes SET vote_type = $1, created_at = NOW() WHERE post_id = $2 AND user_id = $3',
        [vote_type, postId, userId]
      );
    } else {
      // Create new vote
      await pool.query(
        'INSERT INTO post_votes (post_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [postId, userId, vote_type]
      );
    }
    
    // Update post vote counts
    const voteCounts = await pool.query(`
      UPDATE posts SET 
        upvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = $1 AND vote_type = 'upvote'),
        downvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = $1 AND vote_type = 'downvote')
      WHERE id = $1
      RETURNING upvotes, downvotes
    `, [postId]);
    
    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        upvotes: voteCounts.rows[0].upvotes,
        downvotes: voteCounts.rows[0].downvotes
      }
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    res.status(500).json({ 
      error: 'Failed to vote on post',
      details: error.message 
    });
  }
});

// Get vote information for a specific post and user
app.get('/api/posts/:postId/vote/:userId', async (req, res) => {
  try {
    const { postId, userId } = req.params;
    
    // Get user's vote for this post
    const userVote = await pool.query(
      'SELECT vote_type FROM post_votes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    
    // Get total vote counts for the post
    const voteCounts = await pool.query(`
      SELECT 
        COALESCE(upvotes, 0) as upvotes,
        COALESCE(downvotes, 0) as downvotes
      FROM posts 
      WHERE id = $1
    `, [postId]);
    
    res.json({
      success: true,
      data: {
        user_vote: userVote.rows.length > 0 ? userVote.rows[0].vote_type : null,
        upvotes: voteCounts.rows.length > 0 ? voteCounts.rows[0].upvotes : 0,
        downvotes: voteCounts.rows.length > 0 ? voteCounts.rows[0].downvotes : 0,
        has_voted: userVote.rows.length > 0
      },
      message: 'Vote information retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching vote information:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vote information',
      details: error.message 
    });
  }
});

// Vote on post endpoint (simplified format without userId in URL)
app.post('/api/posts/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { vote_type } = req.body; // 'upvote' or 'downvote'
    const userId = req.headers['x-user-id'] || 1; // Get user ID from header
    
    // Check if user already voted
    const existingVote = await pool.query(
      'SELECT * FROM post_votes WHERE post_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (existingVote.rows.length > 0) {
      // Update existing vote
      await pool.query(
        'UPDATE post_votes SET vote_type = $1, created_at = NOW() WHERE post_id = $2 AND user_id = $3',
        [vote_type, id, userId]
      );
    } else {
      // Create new vote
      await pool.query(
        'INSERT INTO post_votes (post_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [id, userId, vote_type]
      );
    }
    
    // Update post vote counts
    const voteCounts = await pool.query(`
      UPDATE posts SET 
        upvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = $1 AND vote_type = 'upvote'),
        downvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = $1 AND vote_type = 'downvote')
      WHERE id = $1
      RETURNING upvotes, downvotes
    `, [id]);
    
    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        upvotes: voteCounts.rows[0].upvotes,
        downvotes: voteCounts.rows[0].downvotes
      }
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    res.status(500).json({ 
      error: 'Failed to vote on post',
      details: error.message 
    });
  }
});

// Vote on comment endpoint
app.post('/api/comments/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { vote_type } = req.body; // 'upvote' or 'downvote'
    const userId = req.headers['x-user-id'] || 1;
    
    // Create comment_votes table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_votes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER,
        user_id INTEGER,
        vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    `);
    
    // Check if user already voted on this comment
    const existingVote = await pool.query(
      'SELECT * FROM comment_votes WHERE comment_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (existingVote.rows.length > 0) {
      // Update existing vote
      await pool.query(
        'UPDATE comment_votes SET vote_type = $1, created_at = NOW() WHERE comment_id = $2 AND user_id = $3',
        [vote_type, id, userId]
      );
    } else {
      // Create new vote
      await pool.query(
        'INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [id, userId, vote_type]
      );
    }
    
    // Update comment vote counts
    const voteCounts = await pool.query(`
      UPDATE comments SET 
        upvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = $1 AND vote_type = 'upvote'),
        downvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = $1 AND vote_type = 'downvote')
      WHERE id = $1
      RETURNING upvotes, downvotes
    `, [id]);
    
    res.json({
      success: true,
      message: 'Comment vote recorded successfully',
      data: {
        upvotes: voteCounts.rows[0].upvotes,
        downvotes: voteCounts.rows[0].downvotes
      }
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    res.status(500).json({ 
      error: 'Failed to vote on comment',
      details: error.message 
    });
  }
});

// Get comment vote information
app.get('/api/comments/:id/vote/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    // Get user's vote for this comment
    const userVote = await pool.query(
      'SELECT vote_type FROM comment_votes WHERE comment_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    // Get total vote counts for the comment
    const voteCounts = await pool.query(`
      SELECT 
        COALESCE(upvotes, 0) as upvotes,
        COALESCE(downvotes, 0) as downvotes
      FROM comments 
      WHERE id = $1
    `, [id]);
    
    res.json({
      success: true,
      data: {
        user_vote: userVote.rows.length > 0 ? userVote.rows[0].vote_type : null,
        upvotes: voteCounts.rows.length > 0 ? voteCounts.rows[0].upvotes : 0,
        downvotes: voteCounts.rows.length > 0 ? voteCounts.rows[0].downvotes : 0,
        has_voted: userVote.rows.length > 0
      },
      message: 'Comment vote information retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching comment vote information:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comment vote information',
      details: error.message 
    });
  }
});

// Share post endpoint
app.post('/api/posts/:id/shares', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || 1;
    
    // Record the share
    await pool.query(
      'INSERT INTO post_shares (post_id, user_id, created_at) VALUES ($1, $2, NOW())',
      [id, userId]
    );
    
    // Get updated share count
    const shareCount = await pool.query(
      'SELECT COUNT(*) as share_count FROM post_shares WHERE post_id = $1',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Post shared successfully',
      data: {
        share_count: parseInt(shareCount.rows[0].share_count)
      }
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ 
      error: 'Failed to share post',
      details: error.message 
    });
  }
});

// Share post endpoint (frontend format without 's')
app.post('/api/posts/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || 1;
    
    // Record the share
    await pool.query(
      'INSERT INTO post_shares (post_id, user_id, created_at) VALUES ($1, $2, NOW())',
      [id, userId]
    );
    
    // Get updated share count
    const shareCount = await pool.query(
      'SELECT COUNT(*) as share_count FROM post_shares WHERE post_id = $1',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Post shared successfully',
      data: {
        share_count: parseInt(shareCount.rows[0].share_count)
      }
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ 
      error: 'Failed to share post',
      details: error.message 
    });
  }
});

// Get post shares endpoint
app.get('/api/posts/:id/shares', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get share count and recent shares
    const shareCount = await pool.query(
      'SELECT COUNT(*) as share_count FROM post_shares WHERE post_id = $1',
      [id]
    );
    
    const recentShares = await pool.query(`
      SELECT 
        ps.*,
        u.username as shared_by
      FROM post_shares ps
      LEFT JOIN users u ON ps.user_id = u.id
      WHERE ps.post_id = $1
      ORDER BY ps.created_at DESC
      LIMIT 10
    `, [id]);
    
    res.json({
      success: true,
      data: {
        share_count: parseInt(shareCount.rows[0].share_count),
        recent_shares: recentShares.rows
      },
      message: 'Shares retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching shares:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shares',
      details: error.message 
    });
  }
});

// Get post comments endpoint
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        u.username as author_name,
        COALESCE(c.upvotes, 0) as upvotes,
        COALESCE(c.downvotes, 0) as downvotes
      FROM comments c
      LEFT JOIN users u ON c.author = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      message: 'Comments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      details: error.message 
    });
  }
});

// Create comment endpoint
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.headers['x-user-id'] || 1;
    
    const result = await pool.query(`
      INSERT INTO comments (post_id, author, content, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [id, userId, content]);
    
    res.json({
      success: true,
      message: 'Comment created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      error: 'Failed to create comment',
      details: error.message 
    });
  }
});

// Communities endpoint with privacy info
app.get('/api/communities', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 1; // Default to user 1 for demo
    
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(cm.id) as actual_member_count,
        COALESCE(c.visibility, 'public') as visibility,
        CASE 
          WHEN c.visibility = 'private' THEN EXISTS(
            SELECT 1 FROM community_memberships cm2 
            WHERE cm2.community_id = c.id AND cm2.user_id = $1 AND cm2.status = 'active'
          )
          ELSE true
        END as can_view_content,
        EXISTS(
          SELECT 1 FROM join_requests jr 
          WHERE jr.community_id = c.id AND jr.user_id = $1 AND jr.status = 'pending'
        ) as has_pending_request
      FROM communities c
      LEFT JOIN community_memberships cm ON c.id = cm.community_id AND cm.status = 'active'
      GROUP BY c.id, c.visibility
      ORDER BY c.member_count DESC, c.created_at DESC
      LIMIT 50
    `, [userId]);
    
    res.json({
      message: 'Communities retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch communities',
      details: error.message 
    });
  }
});

// Create community endpoint with privacy settings
app.post('/api/communities', async (req, res) => {
  try {
    const { name, description, visibility = 'public' } = req.body;
    const userId = req.headers['x-user-id'] || 1; // Default to user 1 for demo
    
    // Validate visibility
    if (!['public', 'private'].includes(visibility)) {
      return res.status(400).json({ 
        error: 'Invalid visibility. Must be "public" or "private"' 
      });
    }
    
    const result = await pool.query(`
      INSERT INTO communities (name, description, visibility, created_by, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [name, description, visibility, userId]);
    
    // Auto-join creator to the community
    await pool.query(`
      INSERT INTO community_memberships (user_id, community_id, role, status, joined_at)
      VALUES ($1, $2, 'admin', 'active', NOW())
      ON CONFLICT (user_id, community_id) DO NOTHING
    `, [userId, result.rows[0].id]);
    
    res.json({
      success: true,
      message: 'Community created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ 
      error: 'Failed to create community',
      details: error.message 
    });
  }
});

// Simple Community Nexus endpoint
app.get('/api/nexus', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'trending' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        c.*,
        (c.member_count + c.post_count * 2) as trending_score
      FROM communities c
      WHERE c.last_active >= NOW() - INTERVAL '30 days'
    `;

    switch (sort) {
      case 'popular':
        query += ' ORDER BY c.member_count DESC, c.created_at DESC';
        break;
      case 'active':
        query += ' ORDER BY c.post_count DESC, c.last_active DESC';
        break;
      case 'newest':
        query += ' ORDER BY c.created_at DESC';
        break;
      default: // trending
        query += ' ORDER BY trending_score DESC, c.last_active DESC';
    }

    query += ` LIMIT $1 OFFSET $2`;

    const result = await pool.query(query, [limit, offset]);
    
    res.json({
      message: 'Community Nexus data retrieved successfully',
      data: {
        communities: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.rows.length
        }
      }
    });
  } catch (error) {
    console.error('Community Nexus error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Community Nexus data',
      details: error.message 
    });
  }
});

// Auth endpoints (enhanced with JWT token)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Try login with email first, then username as fallback
    let result = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    
    // If no result with email, try with username
    if (result.rows.length === 0) {
      result = await pool.query(
        'SELECT id, username, email FROM users WHERE username = $1 AND password = $2',
        [email, password]
      );
    }
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      // Generate a simple token (in production, use proper JWT)
      const token = `token_${user.id}_${Date.now()}`;
      
      res.json({
        success: true,
        message: 'Login successful',
        user: user,
        token: token
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: error.message 
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password]
    );
    
    const user = result.rows[0];
    
    // Generate a simple token (in production, use proper JWT)
    const token = `token_${user.id}_${Date.now()}`;
    
    res.json({
      success: true,
      message: 'Registration successful',
      user: user,
      token: token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: error.message 
    });
  }
});

// Username availability check endpoint
app.get('/api/auth/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const result = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    res.json({
      available: result.rows.length === 0,
      message: result.rows.length === 0 ? 'Username is available' : 'Username is already taken'
    });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ 
      error: 'Failed to check username availability',
      details: error.message 
    });
  }
});

// Notifications endpoints
app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    // Mock response for now - in production, implement real notifications
    res.json({
      success: true,
      unreadCount: 0,
      message: 'No unread notifications'
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ 
      error: 'Failed to get notification count',
      details: error.message 
    });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    // Mock response for now - in production, implement real notifications
    res.json({
      success: true,
      data: {},
      message: 'No notifications available'
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ 
      error: 'Failed to get notifications',
      details: error.message 
    });
  }
});

// My communities endpoint
app.get('/api/communities/my', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 1; // Default to user 1 for demo
    
    const result = await pool.query(`
      SELECT 
        c.*,
        cm.role,
        cm.joined_at
      FROM communities c
      JOIN community_memberships cm ON c.id = cm.community_id
      WHERE cm.user_id = $1 AND cm.status = 'active'
      ORDER BY cm.joined_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows,
      message: 'My communities retrieved successfully'
    });
  } catch (error) {
    console.error('My communities error:', error);
    res.status(500).json({ 
      error: 'Failed to get user communities',
      details: error.message 
    });
  }
});

// My sub-clubs endpoint
app.get('/api/sub-clubs/my', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 1; // Default to user 1 for demo
    
    // Since we don't have a sub_clubs table yet, return mock data
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name || ' Sub-Club' as name,
        c.description || ' - A specialized sub-community' as description,
        cm.role,
        cm.joined_at,
        'sub_club' as type
      FROM communities c
      JOIN community_memberships cm ON c.id = cm.community_id
      WHERE cm.user_id = $1 AND cm.status = 'active'
      ORDER BY cm.joined_at DESC
      LIMIT 3
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows,
      message: 'My sub-clubs retrieved successfully'
    });
  } catch (error) {
    console.error('My sub-clubs error:', error);
    res.status(500).json({ 
      error: 'Failed to get user sub-clubs',
      details: error.message 
    });
  }
});

// Join request endpoints for private communities

// Send join request
app.post('/api/join-requests', async (req, res) => {
  try {
    const { communityId, message = '' } = req.body;
    const userId = req.headers['x-user-id'] || 1; // Default to user 1 for demo
    
    // Check if community exists and is private
    const communityResult = await pool.query(
      'SELECT * FROM communities WHERE id = $1',
      [communityId]
    );
    
    if (communityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }
    
    const community = communityResult.rows[0];
    if (community.visibility !== 'private') {
      return res.status(400).json({ 
        error: 'Join requests are only for private communities' 
      });
    }
    
    // Check if user is already a member
    const membershipResult = await pool.query(
      'SELECT * FROM community_memberships WHERE user_id = $1 AND community_id = $2',
      [userId, communityId]
    );
    
    if (membershipResult.rows.length > 0) {
      return res.status(400).json({ error: 'You are already a member of this community' });
    }
    
    // Check for existing request
    const existingRequest = await pool.query(
      'SELECT * FROM join_requests WHERE user_id = $1 AND community_id = $2',
      [userId, communityId]
    );
    
    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ 
        error: 'You have already sent a join request to this community' 
      });
    }
    
    // Create join request
    const result = await pool.query(`
      INSERT INTO join_requests (user_id, community_id, message, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `, [userId, communityId, message]);
    
    res.json({
      success: true,
      message: 'Join request sent successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error sending join request:', error);
    res.status(500).json({ 
      error: 'Failed to send join request',
      details: error.message 
    });
  }
});

// Get join requests for a community (admin only)
app.get('/api/communities/:communityId/join-requests', async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.headers['x-user-id'] || 1; // Default to user 1 for demo
    
    // Check if user is admin of the community
    const adminCheck = await pool.query(
      'SELECT * FROM communities WHERE id = $1 AND created_by = $2',
      [communityId, userId]
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ 
        error: 'You are not authorized to view join requests for this community' 
      });
    }
    
    // Get pending join requests with user details
    const requests = await pool.query(`
      SELECT 
        jr.*,
        u.username,
        u.email
      FROM join_requests jr
      JOIN users u ON jr.user_id = u.id
      WHERE jr.community_id = $1 AND jr.status = 'pending'
      ORDER BY jr.created_at DESC
    `, [communityId]);
    
    res.json({
      success: true,
      data: requests.rows,
      message: 'Join requests retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch join requests',
      details: error.message 
    });
  }
});

// Respond to join request (approve/reject)
app.post('/api/join-requests/:requestId/respond', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.headers['x-user-id'] || 1; // Default to user 1 for demo
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be "approve" or "reject"' 
      });
    }
    
    // Get join request with community info
    const requestResult = await pool.query(`
      SELECT jr.*, c.created_by as community_admin_id
      FROM join_requests jr
      JOIN communities c ON c.id = jr.community_id
      WHERE jr.id = $1
    `, [requestId]);
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Join request not found' });
    }
    
    const request = requestResult.rows[0];
    
    // Check if user is admin of the community
    if (request.community_admin_id !== parseInt(userId)) {
      return res.status(403).json({ 
        error: 'You are not authorized to respond to this join request' 
      });
    }
    
    // Update join request status
    const status = action === 'approve' ? 'approved' : 'rejected';
    await pool.query(
      'UPDATE join_requests SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, requestId]
    );
    
    // If approved, add user to community
    if (action === 'approve') {
      await pool.query(`
        INSERT INTO community_memberships (user_id, community_id, role, status, joined_at)
        VALUES ($1, $2, 'member', 'active', NOW())
        ON CONFLICT (user_id, community_id) DO NOTHING
      `, [request.user_id, request.community_id]);
    }
    
    res.json({
      success: true,
      message: `Join request ${status} successfully`
    });
  } catch (error) {
    console.error('Error responding to join request:', error);
    res.status(500).json({ 
      error: 'Failed to respond to join request',
      details: error.message 
    });
  }
});

// Create demo users endpoint
app.post('/api/auth/create-demo-users', async (req, res) => {
  try {
    const demoUsers = [
      { username: 'alice', email: 'alice@notorix.com', password: 'alice123' },
      { username: 'bob', email: 'bob@notorix.com', password: 'bob123' },
      { username: 'charlie', email: 'charlie@notorix.com', password: 'charlie123' }
    ];
    
    const created = [];
    for (const user of demoUsers) {
      try {
        const result = await pool.query(
          'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
          [user.username, user.email, user.password]
        );
        created.push(result.rows[0]);
      } catch (err) {
        // User might already exist, skip
        if (err.code !== '23505') { // Not a unique violation
          throw err;
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Demo users created successfully',
      created: created,
      total: created.length
    });
  } catch (error) {
    console.error('Create demo users error:', error);
    res.status(500).json({ 
      error: 'Failed to create demo users',
      details: error.message 
    });
  }
});

// User profile endpoints
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get user profile',
      details: error.message 
    });
  }
});

// User posts endpoint
app.get('/api/users/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT 
        p.*,
        u.username as author_name,
        c.name as community_name
      FROM posts p
      LEFT JOIN users u ON p.author = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE p.author = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);
    
    res.json({
      success: true,
      data: result.rows,
      message: 'User posts retrieved successfully',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('User posts error:', error);
    res.status(500).json({ 
      error: 'Failed to get user posts',
      details: error.message 
    });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, bio, location } = req.body;
    
    // Build dynamic query based on provided fields
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (username !== undefined) {
      updateFields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }
    
    if (email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }
    
    if (location !== undefined) {
      updateFields.push(`location = $${paramCount}`);
      values.push(location);
      paramCount++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No fields provided for update'
      });
    }
    
    // Add the user ID as the last parameter
    values.push(id);
    
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, username, email, bio, location
    `;
    
    console.log('Update query:', query);
    console.log('Update values:', values);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'User profile updated successfully'
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update user profile',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server with enhanced error handling
async function startServer() {
  try {
    // Test database connection first
    console.log('🔍 Testing database connection...');
    const dbTest = await testConnection();
    
    if (dbTest.success) {
      console.log('✅ Database connection successful!');
    } else {
      console.log('⚠️ Database connection failed, but starting server anyway...');
    }

    const server = app.listen(PORT, () => {
      console.log('🚀 Server running on port', PORT);
      console.log('📡 API available at: http://localhost:' + PORT);
      console.log('🔗 Frontend URL: http://localhost:5173');
      console.log('🧪 Test endpoints:');
      console.log('   • Health: http://localhost:' + PORT + '/api/health');
      console.log('   • Database: http://localhost:' + PORT + '/api/test-db');
      console.log('   • Posts: http://localhost:' + PORT + '/api/posts');
      console.log('   • Communities: http://localhost:' + PORT + '/api/communities');
      console.log('   • Community Nexus: http://localhost:' + PORT + '/api/nexus');
      console.log('   • User Posts: http://localhost:' + PORT + '/api/users/8/posts');
      console.log('   • Sub-clubs: http://localhost:' + PORT + '/api/sub-clubs/my');
      console.log('\n🎉 Backend server is ready for connections!');
    });

    // Enhanced error handling
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please close other instances or use a different port.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.log('🔄 Server will continue running...');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      console.log('🔄 Server will continue running...');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.log('🔄 Attempting to restart in 5 seconds...');
    setTimeout(startServer, 5000);
  }
}

startServer(); 

// Badge System Endpoints
app.get('/api/users/:id/badges', async (req, res) => {
  try {
    const { id } = req.params;
    const badges = await BadgeService.getUserBadges(parseInt(id));
    
    res.json({
      success: true,
      data: badges,
      message: 'User badges retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user badges:', error);
    res.status(500).json({ 
      error: 'Failed to get user badges',
      details: error.message 
    });
  }
});

// Get badge statistics and leaderboard
app.get('/api/badges/stats', async (req, res) => {
  try {
    const stats = await BadgeService.getBadgeStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Badge statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting badge stats:', error);
    res.status(500).json({ 
      error: 'Failed to get badge statistics',
      details: error.message 
    });
  }
});

// Get all available badges
app.get('/api/badges', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        COUNT(ub.user_id) as awarded_count
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id
      GROUP BY b.id
      ORDER BY b.badge_type, b.name
    `);
    
    res.json({
      success: true,
      data: result.rows,
      message: 'All badges retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting badges:', error);
    res.status(500).json({ 
      error: 'Failed to get badges',
      details: error.message 
    });
  }
});

// Manual badge award (admin only - for testing)
app.post('/api/users/:userId/badges/:badgeId', async (req, res) => {
  try {
    const { userId, badgeId } = req.params;
    
    const client = await pool.connect();
    const awarded = await BadgeService.awardBadge(client, parseInt(userId), parseInt(badgeId));
    client.release();
    
    if (awarded) {
      res.json({
        success: true,
        message: 'Badge awarded successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Badge already awarded or invalid parameters'
      });
    }
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({ 
      error: 'Failed to award badge',
      details: error.message 
    });
  }
}); 