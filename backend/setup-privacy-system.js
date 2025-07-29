const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: './config.env' });

// PostgreSQL connection configuration (using existing config)
const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'notorix',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function setupPrivacySystem() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up Privacy Settings & Join Requests system...');
    
    // Read and execute the SQL file
    const sql = fs.readFileSync('./create-privacy-system.sql', 'utf8');
    
    // Split by statements and execute one by one to handle complex SQL
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await client.query(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          // Some statements might fail if they already exist, that's okay
          if (!error.message.includes('already exists') && 
              !error.message.includes('constraint') && 
              !error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
          }
        }
      }
    }
    
    console.log('🎉 Privacy system setup completed successfully!');
    
    // Test the setup by querying new tables
    console.log('\n📊 Testing setup:');
    
    const communityTest = await client.query('SELECT COUNT(*) as count FROM communities WHERE visibility = $1', ['private']);
    console.log(`   • Private communities: ${communityTest.rows[0].count}`);
    
    const requestsTest = await client.query('SELECT COUNT(*) as count FROM join_requests');
    console.log(`   • Join requests: ${requestsTest.rows[0].count}`);
    
    const pendingTest = await client.query('SELECT COUNT(*) as count FROM pending_join_requests');
    console.log(`   • Pending requests: ${pendingTest.rows[0].count}`);
    
    console.log('\n✅ Privacy Settings & Join Requests system is ready!');
    
  } catch (error) {
    console.error('❌ Error setting up privacy system:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupPrivacySystem()
  .then(() => {
    console.log('🚀 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }); 