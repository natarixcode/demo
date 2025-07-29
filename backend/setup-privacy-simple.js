const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'notorix'
});

async function setupTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up privacy tables...');
    
    // Add visibility column to communities
    await client.query(`
      ALTER TABLE communities 
      ADD COLUMN IF NOT EXISTS visibility VARCHAR(10) DEFAULT 'public'
    `);
    console.log('✅ Added visibility column to communities');
    
    // Create join_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS join_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
        status VARCHAR(10) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, community_id)
      )
    `);
    console.log('✅ Created join_requests table');
    
    // Update existing communities to be public
    await client.query(`
      UPDATE communities SET visibility = 'public' WHERE visibility IS NULL
    `);
    console.log('✅ Updated existing communities to public');
    
    // Insert sample private community
    await client.query(`
      INSERT INTO communities (name, description, visibility, created_by, created_at) 
      VALUES ('Private Tech Club', 'Exclusive tech discussions for verified professionals', 'private', 1, NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Added sample private community');
    
    console.log('🎉 Privacy system setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setupTables(); 