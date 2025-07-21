// backend/server.js - Main Express Server
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

// Import database connection
const { pool } = require('./db');

// Import routes
const testDbRoute = require('./routes/test-db.route');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection with better error handling
let dbConnected = false;
pool.connect()
  .then((client) => {
    console.log("✅ Connected to PostgreSQL successfully!");
    dbConnected = true;
    client.release();
  })
  .catch((err) => {
    console.error("❌ PostgreSQL connection failed:", err.message);
    console.error("🔧 The app will continue without database functionality");
    dbConnected = false;
  });

// Middleware to check database connection
const requireDB = (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'Database connection is not established. Please check your PostgreSQL configuration.'
    });
  }
  next();
};

// ================================
// API ROUTES (with /api prefix)
// ================================

// Mount test-db routes
app.use('/api', testDbRoute);

// Basic route with API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Notorix Backend API',
    version: '1.0.0',
    status: 'running',
    database: dbConnected ? 'connected' : 'disconnected',
    endpoints: {
      health: '/api/health',
      testDb: '/api/test-db',
      customTestDb: '/api/test-db/custom',
      users: '/api/users',
      posts: '/api/posts',
      auth: {
        login: '/api/auth/login',
        register: '/api/auth/register'
      }
    },
    documentation: 'Visit /api/health for system status'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// ================================
// USER ROUTES
// ================================

// Get all users
app.get('/api/users', requireDB, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC');
    res.json({
      message: 'Users retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get user by ID
app.get('/api/users/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User retrieved successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Create new user
app.post('/api/users', requireDB, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password]
    );
    
    res.status(201).json({
      message: 'User created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Update user
app.put('/api/users/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET username = COALESCE($1, username), email = COALESCE($2, email) WHERE id = $3 RETURNING id, username, email, created_at',
      [username, email, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Delete user
app.delete('/api/users/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ================================
// POST ROUTES (Enhanced with Voting, Comments, Shares, Drafts)
// ================================

// Get all posts with enhanced data
app.get('/api/posts', requireDB, async (req, res) => {
  try {
    const { drafts = 'false' } = req.query;
    const includeDrafts = drafts === 'true';
    
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.updated_at, p.is_draft,
             p.upvotes, p.downvotes, p.share_count, p.comment_count,
             u.username as author_name, u.id as author_id
      FROM posts p
      JOIN users u ON p.author = u.id
      WHERE p.is_draft = $1 OR $2 = true
      ORDER BY p.created_at DESC
    `, [false, includeDrafts]);
    
    res.json({
      message: 'Posts retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get post by ID with enhanced data
app.get('/api/posts/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.updated_at, p.is_draft,
             p.upvotes, p.downvotes, p.share_count, p.comment_count,
             u.username as author_name, u.id as author_id
      FROM posts p
      JOIN users u ON p.author = u.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({
      message: 'Post retrieved successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get posts by user ID with enhanced data
app.get('/api/users/:id/posts', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { drafts = 'false' } = req.query;
    const includeDrafts = drafts === 'true';
    
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.updated_at, p.is_draft,
             p.upvotes, p.downvotes, p.share_count, p.comment_count
      FROM posts p
      WHERE p.author = $1 AND (p.is_draft = false OR $2 = true)
      ORDER BY p.created_at DESC
    `, [id, includeDrafts]);
    
    res.json({
      message: 'User posts retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Create new post with draft support
app.post('/api/posts', requireDB, async (req, res) => {
  try {
    const { title, content, author, is_draft = false } = req.body;
    
    if (!title || !content || !author) {
      return res.status(400).json({ error: 'Title, content, and author are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO posts (title, content, author, is_draft) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, author, is_draft]
    );
    
    res.status(201).json({
      message: is_draft ? 'Draft saved successfully' : 'Post created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Update post with draft support
app.put('/api/posts/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_draft } = req.body;
    
    const result = await pool.query(
      'UPDATE posts SET title = COALESCE($1, title), content = COALESCE($2, content), is_draft = COALESCE($3, is_draft), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, content, is_draft, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({
      message: 'Post updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Publish draft
app.put('/api/posts/:id/publish', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE posts SET is_draft = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_draft = true RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found or already published' });
    }
    
    res.json({
      message: 'Post published successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error publishing post:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Delete post
app.delete('/api/posts/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({
      message: 'Post deleted successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ================================
// VOTING ROUTES
// ================================

// Vote on a post
app.post('/api/posts/:id/vote', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, vote_type } = req.body;
    
    if (!user_id || !vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return res.status(400).json({ error: 'User ID and valid vote type (upvote/downvote) are required' });
    }
    
    // Check if user already voted on this post
    const existingVote = await pool.query(
      'SELECT * FROM post_votes WHERE user_id = $1 AND post_id = $2',
      [user_id, id]
    );
    
    let result;
    if (existingVote.rows.length > 0) {
      // Update existing vote
      result = await pool.query(
        'UPDATE post_votes SET vote_type = $1 WHERE user_id = $2 AND post_id = $3 RETURNING *',
        [vote_type, user_id, id]
      );
    } else {
      // Insert new vote
      result = await pool.query(
        'INSERT INTO post_votes (user_id, post_id, vote_type) VALUES ($1, $2, $3) RETURNING *',
        [user_id, id, vote_type]
      );
    }
    
    // Update post vote counts
    await updatePostVoteCounts(id);
    
    res.json({
      message: 'Vote recorded successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error recording vote:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Remove vote from a post
app.delete('/api/posts/:id/vote', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const result = await pool.query(
      'DELETE FROM post_votes WHERE user_id = $1 AND post_id = $2 RETURNING *',
      [user_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vote not found' });
    }
    
    // Update post vote counts
    await updatePostVoteCounts(id);
    
    res.json({
      message: 'Vote removed successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error removing vote:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get user's vote on a post
app.get('/api/posts/:id/vote/:user_id', requireDB, async (req, res) => {
  try {
    const { id, user_id } = req.params;
    
    const result = await pool.query(
      'SELECT vote_type FROM post_votes WHERE user_id = $1 AND post_id = $2',
      [user_id, id]
    );
    
    res.json({
      message: 'User vote retrieved successfully',
      data: result.rows.length > 0 ? result.rows[0] : { vote_type: null }
    });
  } catch (err) {
    console.error('Error fetching user vote:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ================================
// COMMENT ROUTES
// ================================

// Get comments for a post
app.get('/api/posts/:id/comments', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT c.id, c.content, c.parent_comment_id, c.upvotes, c.downvotes, c.created_at, c.updated_at,
             u.username as author_name, u.id as author_id
      FROM comments c
      JOIN users u ON c.author = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [id]);
    
    res.json({
      message: 'Comments retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Create a comment
app.post('/api/posts/:id/comments', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { author, content, parent_comment_id = null } = req.body;
    
    if (!author || !content) {
      return res.status(400).json({ error: 'Author and content are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO comments (post_id, author, content, parent_comment_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, author, content, parent_comment_id]
    );
    
    // Update post comment count
    await pool.query(
      'UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1',
      [id]
    );
    
    res.status(201).json({
      message: 'Comment created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Update a comment
app.put('/api/comments/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await pool.query(
      'UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [content, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({
      message: 'Comment updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Delete a comment
app.delete('/api/comments/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get post_id before deleting
    const postResult = await pool.query('SELECT post_id FROM comments WHERE id = $1', [id]);
    
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const post_id = postResult.rows[0].post_id;
    
    const result = await pool.query('DELETE FROM comments WHERE id = $1 RETURNING *', [id]);
    
    // Update post comment count
    await pool.query(
      'UPDATE posts SET comment_count = comment_count - 1 WHERE id = $1',
      [post_id]
    );
    
    res.json({
      message: 'Comment deleted successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Vote on a comment
app.post('/api/comments/:id/vote', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, vote_type } = req.body;
    
    if (!user_id || !vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return res.status(400).json({ error: 'User ID and valid vote type (upvote/downvote) are required' });
    }
    
    // Check if user already voted on this comment
    const existingVote = await pool.query(
      'SELECT * FROM comment_votes WHERE user_id = $1 AND comment_id = $2',
      [user_id, id]
    );
    
    let result;
    if (existingVote.rows.length > 0) {
      // Update existing vote
      result = await pool.query(
        'UPDATE comment_votes SET vote_type = $1 WHERE user_id = $2 AND comment_id = $3 RETURNING *',
        [vote_type, user_id, id]
      );
    } else {
      // Insert new vote
      result = await pool.query(
        'INSERT INTO comment_votes (user_id, comment_id, vote_type) VALUES ($1, $2, $3) RETURNING *',
        [user_id, id, vote_type]
      );
    }
    
    // Update comment vote counts
    await updateCommentVoteCounts(id);
    
    res.json({
      message: 'Comment vote recorded successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error recording comment vote:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ================================
// SHARE ROUTES
// ================================

// Share a post
app.post('/api/posts/:id/share', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, share_type = 'link' } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO post_shares (user_id, post_id, share_type) VALUES ($1, $2, $3) RETURNING *',
      [user_id, id, share_type]
    );
    
    // Update post share count
    await pool.query(
      'UPDATE posts SET share_count = share_count + 1 WHERE id = $1',
      [id]
    );
    
    res.status(201).json({
      message: 'Post shared successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error sharing post:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get share statistics for a post
app.get('/api/posts/:id/shares', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT share_type, COUNT(*) as count
      FROM post_shares
      WHERE post_id = $1
      GROUP BY share_type
    `, [id]);
    
    res.json({
      message: 'Share statistics retrieved successfully',
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching share statistics:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ================================
// AUTHENTICATION ROUTES
// ================================

// Enhanced login endpoint (supports both email and username)
app.post('/api/auth/login', requireDB, async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Support login with either email or username
    const loginField = email || username;
    
    if (!loginField || !password) {
      return res.status(400).json({ 
        error: 'Email/username and password are required',
        details: 'Please provide either email or username along with password'
      });
    }
    
    // Check if login field is email or username
    const isEmail = loginField.includes('@');
    const query = isEmail 
      ? 'SELECT id, username, email, created_at FROM users WHERE email = $1 AND password = $2'
      : 'SELECT id, username, email, created_at FROM users WHERE username = $1 AND password = $2';
    
    const result = await pool.query(query, [loginField, password]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Email/username or password is incorrect'
      });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      token: `mock-token-${user.id}-${Date.now()}` // Mock JWT token
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message 
    });
  }
});

// Enhanced register endpoint with validation
app.post('/api/auth/register', requireDB, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'All fields are required',
        details: 'Username, email, and password must be provided'
      });
    }
    
    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: 'Invalid username format',
        details: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
      });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password too weak',
        details: 'Password must be at least 6 characters long'
      });
    }
    
    // Check if username already exists
    const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'Username already taken',
        details: 'Please choose a different username'
      });
    }
    
    // Check if email already exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'Email already registered',
        details: 'An account with this email already exists'
      });
    }
    
    // Create the user
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password]
    );
    
    const user = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      token: `mock-token-${user.id}-${Date.now()}` // Mock JWT token
    });
  } catch (err) {
    console.error('Error during registration:', err);
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ 
        error: 'Username or email already exists',
        details: 'Please use a different username or email address'
      });
    }
    res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message 
    });
  }
});

// Check username availability endpoint
app.get('/api/auth/check-username/:username', requireDB, async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.length < 3) {
      return res.status(400).json({
        error: 'Invalid username',
        details: 'Username must be at least 3 characters long'
      });
    }
    
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    const isAvailable = result.rows.length === 0;
    
    res.json({
      username,
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username is already taken'
    });
  } catch (err) {
    console.error('Error checking username:', err);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message 
    });
  }
});

// Create demo users endpoint (for development/testing)
app.post('/api/auth/create-demo-users', requireDB, async (req, res) => {
  try {
    const demoUsers = [
      {
        username: 'demouser',
        email: 'demo@notorix.com',
        password: 'demo123'
      },
      {
        username: 'testuser',
        email: 'test@notorix.com', 
        password: 'test123'
      },
      {
        username: 'admin',
        email: 'admin@notorix.com',
        password: 'admin123'
      }
    ];
    
    const createdUsers = [];
    
    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE username = $1 OR email = $2', 
          [userData.username, userData.email]
        );
        
        if (existingUser.rows.length === 0) {
          // User doesn't exist, create them
          const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [userData.username, userData.email, userData.password]
          );
          createdUsers.push(result.rows[0]);
        } else {
          console.log(`Demo user ${userData.username} already exists, skipping...`);
        }
      } catch (userErr) {
        console.error(`Error creating demo user ${userData.username}:`, userErr);
      }
    }
    
    res.json({
      success: true,
      message: 'Demo users setup completed',
      created: createdUsers,
      total: createdUsers.length
    });
  } catch (err) {
    console.error('Error creating demo users:', err);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message 
    });
  }
});

// Get user posts endpoint
app.get('/api/users/:id/posts', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.updated_at, p.is_draft,
             p.upvotes, p.downvotes, p.share_count, p.comment_count,
             u.username as author_name, u.id as author_id
      FROM posts p
      JOIN users u ON p.author = u.id
      WHERE p.author = $1 AND p.is_draft = false
      ORDER BY p.created_at DESC
    `, [id]);
    
    res.json({
      message: 'User posts retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ================================
// ERROR HANDLING MIDDLEWARE
// ================================

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/test-db',
      'POST /api/test-db/custom',
      'GET /api/users',
      'GET /api/posts',
      'POST /api/auth/login',
      'POST /api/auth/register'
    ]
  });
});

// ================================
// SERVER STARTUP
// ================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}`);
  console.log(`🔗 Frontend URL: http://localhost:3000`);
  console.log(`💾 Database status: ${dbConnected ? 'Connected' : 'Disconnected'}`);
  console.log(`🧪 Test database connection: http://localhost:${PORT}/api/test-db`);
}); 

// ================================
// HELPER FUNCTIONS
// ================================

// Update post vote counts
async function updatePostVoteCounts(postId) {
  try {
    const voteResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE 0 END) as upvotes,
        SUM(CASE WHEN vote_type = 'downvote' THEN 1 ELSE 0 END) as downvotes
      FROM post_votes
      WHERE post_id = $1
    `, [postId]);
    
    const { upvotes = 0, downvotes = 0 } = voteResult.rows[0] || {};
    
    await pool.query(
      'UPDATE posts SET upvotes = $1, downvotes = $2 WHERE id = $3',
      [upvotes, downvotes, postId]
    );
  } catch (err) {
    console.error('Error updating post vote counts:', err);
  }
}

// Update comment vote counts
async function updateCommentVoteCounts(commentId) {
  try {
    const voteResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE 0 END) as upvotes,
        SUM(CASE WHEN vote_type = 'downvote' THEN 1 ELSE 0 END) as downvotes
      FROM comment_votes
      WHERE comment_id = $1
    `, [commentId]);
    
    const { upvotes = 0, downvotes = 0 } = voteResult.rows[0] || {};
    
    await pool.query(
      'UPDATE comments SET upvotes = $1, downvotes = $2 WHERE id = $3',
      [upvotes, downvotes, commentId]
    );
  } catch (err) {
    console.error('Error updating comment vote counts:', err);
  }
} 