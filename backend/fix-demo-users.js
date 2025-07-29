const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'notorix'
});

async function fixDemoUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking existing users...');
    
    // Check what users exist
    const existingUsers = await client.query('SELECT id, username, email FROM users ORDER BY id');
    console.log('📋 Existing users:');
    existingUsers.rows.forEach(user => {
      console.log(`   • ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });
    
    console.log('\n🔧 Creating/updating demo users...');
    
    // Create or update demo users with known credentials
    const demoUsers = [
      { username: 'demo', email: 'demo@notorix.com', password: 'demo123' },
      { username: 'admin', email: 'admin@notorix.com', password: 'admin123' },
      { username: 'test', email: 'test@notorix.com', password: 'test123' },
      { username: 'demouser', email: 'demouser@notorix.com', password: 'demo123' }
    ];
    
    for (const user of demoUsers) {
      // Use INSERT ... ON CONFLICT to create or update
      await client.query(`
        INSERT INTO users (username, email, password, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (email) DO UPDATE SET
          username = EXCLUDED.username,
          password = EXCLUDED.password
      `, [user.username, user.email, user.password]);
      
      console.log(`✅ Created/updated user: ${user.email} with password: ${user.password}`);
    }
    
    console.log('\n📋 Updated user list:');
    const updatedUsers = await client.query('SELECT id, username, email FROM users ORDER BY id');
    updatedUsers.rows.forEach(user => {
      console.log(`   • ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });
    
    console.log('\n🎉 Demo users are ready!');
    console.log('🔑 You can now login with:');
    console.log('   • Email: demo@notorix.com, Password: demo123');
    console.log('   • Email: admin@notorix.com, Password: admin123');
    console.log('   • Email: test@notorix.com, Password: test123');
    console.log('   • Email: demouser@notorix.com, Password: demo123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDemoUsers(); 