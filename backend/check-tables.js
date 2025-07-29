const { pool } = require('./db');

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Available tables:');
    result.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    // Also check community_memberships structure
    const membershipsStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'community_memberships'
      ORDER BY ordinal_position
    `);
    
    console.log('\\n📋 community_memberships structure:');
    membershipsStructure.rows.forEach(row => {
      console.log('  -', row.column_name, ':', row.data_type);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables(); 