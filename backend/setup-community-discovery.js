// backend/setup-community-discovery.js
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runDiscoveryMigration() {
  try {
    console.log('🚀 Starting Community Discovery migration...');
    
    // Read the SQL migration file
    const sqlFile = path.join(__dirname, 'create-community-discovery.sql');
    const sqlCommands = fs.readFileSync(sqlFile, 'utf8');
    
    // Connect to database
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    try {
      // Execute the SQL commands
      await client.query(sqlCommands);
      console.log('✅ Community Discovery migration completed successfully!');
      
      // Update existing communities with default values
      const updateResult = await client.query(`
        UPDATE communities 
        SET 
          member_count = COALESCE(
            (SELECT COUNT(*) FROM memberships WHERE community_id = communities.id), 
            0
          ),
          post_count = COALESCE(
            (SELECT COUNT(*) FROM posts WHERE community_id = communities.id), 
            0
          ),
          last_active = COALESCE(last_active, created_at, NOW())
        WHERE member_count IS NULL OR post_count IS NULL OR last_active IS NULL
      `);
      
      console.log(`✅ Updated ${updateResult.rowCount} existing communities with count data`);
      
      // Test the new functions
      const testResult = await client.query(`
        SELECT 
          COUNT(*) as total_communities,
          AVG(member_count) as avg_members,
          AVG(post_count) as avg_posts
        FROM communities
      `);
      
      const stats = testResult.rows[0];
      console.log('📊 Database Statistics:');
      console.log(`   Total Communities: ${stats.total_communities}`);
      console.log(`   Average Members: ${parseFloat(stats.avg_members).toFixed(1)}`);
      console.log(`   Average Posts: ${parseFloat(stats.avg_posts).toFixed(1)}`);
      
    } finally {
      client.release();
    }
    
    console.log('🎉 Community Discovery setup completed successfully!');
    console.log('You can now access the Discovery page at: http://localhost:5173/discovery');
    
  } catch (error) {
    console.error('❌ Error running Community Discovery migration:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runDiscoveryMigration(); 