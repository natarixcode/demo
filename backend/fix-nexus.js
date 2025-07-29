const { pool } = require('./db');

async function fixNexus() {
  try {
    console.log('🔧 Fixing nexus API issues...');
    
    // Add missing columns to communities table if they don't exist
    const columnsToAdd = [
      { name: 'last_active', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'post_count', type: 'INTEGER DEFAULT 0' },
      { name: 'member_count', type: 'INTEGER DEFAULT 0' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await pool.query(`
          ALTER TABLE communities 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
        console.log(`✅ Added column ${column.name} to communities table`);
      } catch (err) {
        console.log(`ℹ️ Column ${column.name} might already exist:`, err.message);
      }
    }
    
    // Update existing communities with calculated values
    console.log('📊 Updating community statistics...');
    
    // Update member counts
    await pool.query(`
      UPDATE communities 
      SET member_count = (
        SELECT COUNT(*) 
        FROM community_memberships 
        WHERE community_id = communities.id
      )
    `);
    
    // Update post counts
    await pool.query(`
      UPDATE communities 
      SET post_count = (
        SELECT COUNT(*) 
        FROM posts 
        WHERE community_id = communities.id
      )
    `);
    
    // Update last_active dates
    await pool.query(`
      UPDATE communities 
      SET last_active = COALESCE(
        (SELECT MAX(created_at) 
         FROM posts 
         WHERE community_id = communities.id), 
        communities.created_at
      )
    `);
    
    console.log('✅ Community statistics updated');
    
    // Test the nexus API
    console.log('🧪 Testing nexus API...');
    
    const testResult = await pool.query(`
      SELECT 
        c.id, c.name, c.member_count, c.post_count, c.last_active,
        CASE WHEN m.user_id IS NOT NULL THEN true ELSE false END as is_joined
      FROM communities c
      LEFT JOIN community_memberships m ON c.id = m.community_id AND m.user_id = 1
      LIMIT 5
    `);
    
    console.log('📋 Sample communities:');
    testResult.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.member_count} members, ${row.post_count} posts`);
    });
    
    console.log('🎉 Nexus API should be working now!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing nexus:', error);
    process.exit(1);
  }
}

fixNexus(); 