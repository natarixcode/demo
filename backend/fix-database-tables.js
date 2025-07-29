const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'notorix'
});

async function fixDatabaseTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing database tables for post features...');
    
    // First, check if posts table exists
    const postsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'posts'
      );
    `);
    
    if (!postsTableCheck.rows[0].exists) {
      console.log('⚠️  Posts table does not exist, creating it...');
      await client.query(`
        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          author INTEGER,
          community_id INTEGER,
          sub_club_id INTEGER,
          is_draft BOOLEAN DEFAULT false,
          upvotes INTEGER DEFAULT 0,
          downvotes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created posts table');
    } else {
      // Add vote columns if they don't exist
      try {
        await client.query(`
          ALTER TABLE posts 
          ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0
        `);
        console.log('✅ Added/verified upvotes and downvotes columns to posts table');
      } catch (error) {
        console.log('ℹ️  Vote columns may already exist');
      }
    }
    
    // Ensure users table exists (needed for foreign keys)
    const usersTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!usersTableCheck.rows[0].exists) {
      console.log('⚠️  Users table does not exist, creating it...');
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add sample users
      await client.query(`
        INSERT INTO users (username, email, password_hash) VALUES
        ('demo_user', 'demo@example.com', 'hashed_password'),
        ('test_user', 'test@example.com', 'hashed_password'),
        ('admin_user', 'admin@example.com', 'hashed_password')
        ON CONFLICT (username) DO NOTHING
      `);
      console.log('✅ Created users table with sample data');
    }
    
    // Create post_votes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_votes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER,
        user_id INTEGER,
        vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);
    console.log('✅ Ensured post_votes table exists');
    
    // Create post_shares table
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_shares (
        id SERIAL PRIMARY KEY,
        post_id INTEGER,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Ensured post_shares table exists');
    
    // Create comments table with correct column name
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER,
        author INTEGER,
        content TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Ensured comments table exists');
    
    // Add some sample posts if none exist
    const postCount = await client.query('SELECT COUNT(*) FROM posts');
    if (parseInt(postCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO posts (title, content, author, upvotes, downvotes) VALUES
        ('Welcome to Notorix!', 'This is your first post on the platform.', 1, 5, 0),
        ('Community Guidelines', 'Please be respectful and follow our community rules.', 2, 3, 1),
        ('Feature Updates', 'We have added new voting and sharing features!', 1, 8, 0)
      `);
      console.log('✅ Added sample posts');
    }
    
    // Add some sample votes and shares
    try {
      await client.query(`
        INSERT INTO post_votes (post_id, user_id, vote_type) VALUES
        (1, 1, 'upvote'),
        (1, 2, 'upvote'),
        (2, 1, 'downvote'),
        (2, 3, 'upvote')
        ON CONFLICT (post_id, user_id) DO NOTHING
      `);
      
      await client.query(`
        INSERT INTO post_shares (post_id, user_id) VALUES
        (1, 1),
        (1, 2),
        (2, 3)
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ Added sample votes and shares');
    } catch (error) {
      console.log('ℹ️  Sample data may already exist');
    }
    
    // Update post vote counts
    await client.query(`
      UPDATE posts SET 
        upvotes = COALESCE((SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND vote_type = 'upvote'), 0),
        downvotes = COALESCE((SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND vote_type = 'downvote'), 0)
    `);
    console.log('✅ Updated post vote counts');
    
    console.log('🎉 Database tables setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDatabaseTables(); 