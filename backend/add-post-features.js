const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'notorix'
});

async function addPostFeatures() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding post features (votes, shares, comments)...');
    
    // Add vote columns to posts table
    await client.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0
    `);
    console.log('✅ Added upvotes and downvotes columns to posts table');
    
    // Ensure post_votes table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_votes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);
    console.log('✅ Ensured post_votes table exists');
    
    // Ensure post_shares table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_shares (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Ensured post_shares table exists');
    
    // Ensure comments table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Ensured comments table exists');
    
    // Add some sample votes and comments for testing
    await client.query(`
      INSERT INTO post_votes (post_id, user_id, vote_type) VALUES
      (1, 1, 'upvote'),
      (1, 2, 'upvote'),
      (2, 1, 'downvote'),
      (2, 3, 'upvote')
      ON CONFLICT (post_id, user_id) DO NOTHING
    `);
    console.log('✅ Added sample votes');
    
    // Update post vote counts
    await client.query(`
      UPDATE posts SET 
        upvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND vote_type = 'upvote'),
        downvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = posts.id AND vote_type = 'downvote')
    `);
    console.log('✅ Updated post vote counts');
    
    console.log('🎉 Post features setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addPostFeatures(); 