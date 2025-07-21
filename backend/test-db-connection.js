// test-db-connection.js - PostgreSQL Connection Tester
const { Pool } = require('pg');
require('dotenv').config();

// Common password combinations to test
const connectionOptions = [
  // From .env file
  process.env.DATABASE_URL,
  
  // Common password combinations
  'postgresql://postgres@localhost:5432/notorix',
  'postgresql://postgres:admin@localhost:5432/notorix', 
  'postgresql://postgres:password@localhost:5432/notorix',
  'postgresql://postgres:123456@localhost:5432/notorix',
  'postgresql://postgres:postgres@localhost:5432/notorix',
  'postgresql://postgres:root@localhost:5432/notorix',
  
  // Try with postgres database instead of notorix
  'postgresql://postgres@localhost:5432/postgres',
  'postgresql://postgres:admin@localhost:5432/postgres',
  'postgresql://postgres:password@localhost:5432/postgres',
];

async function testConnection(connectionString, index) {
  if (!connectionString) {
    console.log(`❌ Test ${index + 1}: Connection string is undefined`);
    return false;
  }

  console.log(`🔄 Test ${index + 1}: Testing connection...`);
  console.log(`🔗 Connection: ${connectionString.replace(/:([^@/]+)@/, ':****@')}`);
  
  const pool = new Pool({ connectionString });
  
  try {
    const client = await pool.connect();
    console.log(`✅ Test ${index + 1}: Connection successful!`);
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log(`📊 Database time: ${result.rows[0].current_time}`);
    console.log(`📊 PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
    
    // Check if notorix database exists
    const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname = 'notorix'");
    if (dbCheck.rows.length > 0) {
      console.log(`✅ Database 'notorix' exists`);
    } else {
      console.log(`⚠️ Database 'notorix' does not exist - you need to create it`);
    }
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Test ${index + 1}: Connection failed`);
    console.log(`📄 Error: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 POSTGRESQL CONNECTION TESTER');
  console.log('='.repeat(50));
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🔍 Testing ${connectionOptions.length} connection options...\n`);
  
  let successfulConnection = null;
  
  for (let i = 0; i < connectionOptions.length; i++) {
    const success = await testConnection(connectionOptions[i], i);
    
    if (success) {
      successfulConnection = connectionOptions[i];
      console.log(`\n🎉 FOUND WORKING CONNECTION!`);
      console.log(`🔗 Use this in your .env file:`);
      console.log(`DATABASE_URL=${successfulConnection}\n`);
      break;
    }
    
    console.log(''); // Add spacing between tests
  }
  
  if (!successfulConnection) {
    console.log('\n❌ NO WORKING CONNECTION FOUND');
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Make sure PostgreSQL is running:');
    console.log('   - Check if pg service is active');
    console.log('   - Try: Get-Service postgresql*');
    console.log('');
    console.log('2. Check your PostgreSQL password:');
    console.log('   - Open pgAdmin and try to connect');
    console.log('   - Or reset password: ALTER USER postgres PASSWORD \'newpassword\';');
    console.log('');
    console.log('3. Create the notorix database:');
    console.log('   - Connect to PostgreSQL as postgres user');
    console.log('   - Run: CREATE DATABASE notorix;');
    console.log('');
    console.log('4. Check if PostgreSQL is listening on port 5432:');
    console.log('   - Run: netstat -an | findstr :5432');
  } else {
    console.log('🔄 NEXT STEPS:');
    console.log('1. Copy the working DATABASE_URL to your .env file');
    console.log('2. Rename env-template.txt to .env');
    console.log('3. Update the DATABASE_URL in .env file');
    console.log('4. Run your server: node server.js');
  }
  
  console.log('\n' + '='.repeat(50));
}

// Auto-create database function
async function createDatabase() {
  console.log('\n🔨 ATTEMPTING TO CREATE DATABASE...');
  
  // Try to connect to postgres database first
  const adminConnections = [
    'postgresql://postgres@localhost:5432/postgres',
    'postgresql://postgres:admin@localhost:5432/postgres',
    'postgresql://postgres:password@localhost:5432/postgres',
  ];
  
  for (const connStr of adminConnections) {
    try {
      const pool = new Pool({ connectionString: connStr });
      const client = await pool.connect();
      
      // Check if database exists
      const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname = 'notorix'");
      
      if (dbCheck.rows.length === 0) {
        await client.query('CREATE DATABASE notorix');
        console.log('✅ Database "notorix" created successfully!');
      } else {
        console.log('✅ Database "notorix" already exists');
      }
      
      client.release();
      await pool.end();
      return true;
      
    } catch (error) {
      console.log(`❌ Failed with ${connStr}: ${error.message}`);
    }
  }
  
  return false;
}

// Main execution
async function main() {
  await runAllTests();
  
  // If no connection worked, try to create database
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n❓ Would you like me to try creating the "notorix" database? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      const created = await createDatabase();
      if (created) {
        console.log('\n🔄 Retesting connections...');
        await runAllTests();
      }
    }
    rl.close();
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testConnection, createDatabase }; 