const { pool } = require('./db');

async function checkCommunities() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'communities'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Communities table columns:');
    result.rows.forEach(row => {
      console.log('  -', row.column_name, ':', row.data_type);
    });
    
    // Check if posts table has community_id
    const postsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'posts'
      ORDER BY ordinal_position
    `);
    
    console.log('\\n📋 Posts table columns:');
    postsResult.rows.forEach(row => {
      console.log('  -', row.column_name, ':', row.data_type);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCommunities(); 