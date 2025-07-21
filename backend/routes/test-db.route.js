// backend/routes/test-db.route.js - Database Test API Route
const express = require('express');
const { testConnection } = require('../db');

const router = express.Router();

/**
 * @route   GET /api/test-db
 * @desc    Test PostgreSQL database connectivity
 * @access  Public (in development/testing)
 * @returns {Object} Connection status, timing, and database info
 */
router.get('/test-db', async (req, res) => {
  const requestStartTime = Date.now();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test the database connection
    const connectionResult = await testConnection();
    
    // Calculate total request time
    const totalRequestTime = Date.now() - requestStartTime;
    
    if (connectionResult.success) {
      // Success response
      return res.status(200).json({
        status: 'success',
        message: connectionResult.message,
        timestamp: new Date().toISOString(),
        requestTime: `${totalRequestTime}ms`,
        database: {
          connected: true,
          ...connectionResult.data
        }
      });
    } else {
      // Connection failed but we got a controlled error
      return res.status(503).json({
        status: 'error',
        message: connectionResult.message,
        timestamp: new Date().toISOString(),
        requestTime: `${totalRequestTime}ms`,
        database: {
          connected: false,
          error: connectionResult.error
        }
      });
    }
    
  } catch (error) {
    // Unexpected error during the test
    console.error('❌ Unexpected error in test-db route:', error);
    
    const totalRequestTime = Date.now() - requestStartTime;
    
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during database test',
      timestamp: new Date().toISOString(),
      requestTime: `${totalRequestTime}ms`,
      database: {
        connected: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        }
      }
    });
  }
});

/**
 * @route   POST /api/test-db/custom
 * @desc    Test database with custom connection parameters
 * @access  Public (in development/testing)
 * @body    {host, port, database, user, password}
 */
router.post('/test-db/custom', async (req, res) => {
  const { host, port, database, user, password } = req.body;
  
  // Validate required fields
  if (!host || !port || !database || !user || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required connection parameters',
      required: ['host', 'port', 'database', 'user', 'password']
    });
  }
  
  const { Pool } = require('pg');
  
  // Create temporary pool with custom config
  const customPool = new Pool({
    host,
    port: parseInt(port),
    database,
    user,
    password,
    max: 1, // Only one connection for testing
    connectionTimeoutMillis: 5000
  });
  
  try {
    const client = await customPool.connect();
    const result = await client.query('SELECT NOW() as test_time');
    client.release();
    
    await customPool.end();
    
    return res.status(200).json({
      status: 'success',
      message: 'Custom database connection successful!',
      testTime: result.rows[0].test_time
    });
    
  } catch (error) {
    await customPool.end();
    
    return res.status(503).json({
      status: 'error',
      message: 'Custom database connection failed',
      error: {
        code: error.code,
        message: error.message
      }
    });
  }
});

module.exports = router; 