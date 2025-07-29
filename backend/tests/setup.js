// tests/setup.js - Test Configuration Setup
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Test database configuration
const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/notorix_test',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const defaultUser = {
      username: `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: `test_${Date.now()}@example.com`,
      password: 'hashedPassword123',
      display_name: 'Test User',
      avatar_color: '#3B82F6',
      karma: 0,
      post_count: 0,
      comment_count: 0
    };
    
    const user = { ...defaultUser, ...userData };
    
    const result = await testPool.query(
      `INSERT INTO users (username, email, password, display_name, avatar_color, karma, post_count, comment_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user.username, user.email, user.password, user.display_name, user.avatar_color, user.karma, user.post_count, user.comment_count]
    );
    
    return result.rows[0];
  },
  
  // Create test post
  createTestPost: async (authorId, postData = {}) => {
    const defaultPost = {
      title: `Test Post ${Date.now()}`,
      content: `Test content ${Math.random().toString(36).substr(2, 9)}`,
      is_draft: false,
      upvotes: 0,
      downvotes: 0,
      share_count: 0,
      comment_count: 0
    };
    
    const post = { ...defaultPost, ...postData };
    
    const result = await testPool.query(
      `INSERT INTO posts (title, content, author, is_draft, upvotes, downvotes, share_count, comment_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [post.title, post.content, authorId, post.is_draft, post.upvotes, post.downvotes, post.share_count, post.comment_count]
    );
    
    return result.rows[0];
  },
  
  // Create test notification
  createTestNotification: async (userId, notificationData = {}) => {
    const defaultNotification = {
      type: 'comment',
      title: 'Test Notification',
      content: 'Test notification content',
      is_read: false,
      sender_id: null,
      related_id: null,
      related_type: 'post',
      action_url: '/posts/1'
    };
    
    const notification = { ...defaultNotification, ...notificationData };
    
    const result = await testPool.query(
      `INSERT INTO notifications (user_id, type, title, content, is_read, sender_id, related_id, related_type, action_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, notification.type, notification.title, notification.content, notification.is_read, 
       notification.sender_id, notification.related_id, notification.related_type, notification.action_url]
    );
    
    return result.rows[0];
  },
  
  // Clean up test data
  cleanupTestData: async () => {
    await testPool.query('DELETE FROM notifications WHERE title LIKE \'Test%\' OR title LIKE \'%test%\'');
    await testPool.query('DELETE FROM posts WHERE title LIKE \'Test%\' OR title LIKE \'%test%\'');
    await testPool.query('DELETE FROM users WHERE username LIKE \'testuser_%\' OR email LIKE \'test_%@example.com\'');
  },
  
  // Generate random test data
  generateRandomData: (type, count = 1) => {
    const data = [];
    
    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'user':
          data.push({
            username: `testuser_${Date.now()}_${i}`,
            email: `test_${Date.now()}_${i}@example.com`,
            password: 'hashedPassword123',
            display_name: `Test User ${i}`,
            avatar_color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][i % 4]
          });
          break;
          
        case 'notification':
          data.push({
            type: ['comment', 'reply', 'join', 'like', 'mention'][i % 5],
            title: `Test Notification ${i}`,
            content: `Test notification content ${i}`,
            is_read: i % 2 === 0,
            related_id: i + 1,
            related_type: 'post',
            action_url: `/posts/${i + 1}`
          });
          break;
          
        case 'post':
          data.push({
            title: `Test Post ${i}`,
            content: `Test post content ${i}`,
            is_draft: i % 10 === 0,
            upvotes: Math.floor(Math.random() * 100),
            downvotes: Math.floor(Math.random() * 10)
          });
          break;
      }
    }
    
    return data;
  },
  
  // Performance testing utilities
  measurePerformance: async (fn, iterations = 100) => {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await fn();
      const end = process.hrtime.bigint();
      results.push(Number(end - start) / 1000000); // Convert to milliseconds
    }
    
    return {
      min: Math.min(...results),
      max: Math.max(...results),
      avg: results.reduce((a, b) => a + b, 0) / results.length,
      median: results.sort((a, b) => a - b)[Math.floor(results.length / 2)],
      results
    };
  }
};

// Setup test database before all tests
beforeAll(async () => {
  // Ensure test database tables exist
  try {
    await testPool.query('SELECT 1 FROM users LIMIT 1');
    await testPool.query('SELECT 1 FROM notifications LIMIT 1');
  } catch (err) {
    console.error('Test database not properly set up:', err.message);
    throw new Error('Test database setup failed');
  }
});

// Clean up after each test suite
afterEach(async () => {
  await global.testUtils.cleanupTestData();
});

// Close test database connection after all tests
afterAll(async () => {
  await testPool.end();
});

module.exports = { testPool }; 