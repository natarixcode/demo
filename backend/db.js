// backend/db.js - PostgreSQL Database Configuration
const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

// PostgreSQL connection configuration
const poolConfig = {
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'notorix',
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
};

// Create connection pool
const pool = new Pool(poolConfig);

// Pool error handling
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  process.exit(-1);
});

pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL');
});

pool.on('remove', (client) => {
  console.log('🔌 Client removed from pool');
});

// Test database connection function
const testConnection = async () => {
  const startTime = Date.now();
  let client;
  
  try {
    // Get client from pool
    client = await pool.connect();
    
    // Simple test query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    
    // Calculate connection time
    const connectionTime = Date.now() - startTime;
    
    // Return success result
    return {
      success: true,
      message: 'Database connection successful!',
      data: {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].postgres_version,
        connectionTime: `${connectionTime}ms`,
        poolInfo: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    return {
      success: false,
      message: 'Database connection failed!',
      error: {
        code: error.code,
        message: error.message,
        detail: error.detail || 'No additional details available',
        hint: error.hint || 'Check your database credentials and ensure PostgreSQL is running'
      }
    };
    
  } finally {
    // Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔒 Database pool has ended');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
};

// Handle process termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = {
  pool,
  testConnection,
  closePool
}; 