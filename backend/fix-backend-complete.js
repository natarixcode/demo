// backend/fix-backend-complete.js - Comprehensive Backend Fix
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Test multiple connection configurations
const connectionConfigs = [
  {
    user: 'postgres',
    password: 'admin',
    host: 'localhost',
    port: 5432,
    database: 'notorix',
    name: 'Standard Config (postgres:admin)'
  },
  {
    user: 'postgres',
    password: '',
    host: 'localhost',
    port: 5432,
    database: 'notorix',
    name: 'No Password Config'
  },
  {
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'notorix',
    name: 'Default PostgreSQL (postgres:postgres)'
  },
  {
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'notorix',
    name: 'Common Password (postgres:password)'
  }
];

async function testConnection(config) {
  const pool = new Pool(config);
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    await pool.end();
    return { success: true, time: result.rows[0].current_time };
  } catch (error) {
    await pool.end();
    return { success: false, error: error.message };
  }
}

async function findWorkingConnection() {
  console.log('🔍 FINDING WORKING DATABASE CONNECTION...\n');
  
  for (const config of connectionConfigs) {
    console.log(`🧪 Testing: ${config.name}`);
    const result = await testConnection(config);
    
    if (result.success) {
      console.log(`✅ SUCCESS! Found working connection: ${config.name}`);
      console.log(`📅 Database time: ${result.time}\n`);
      return config;
    } else {
      console.log(`❌ Failed: ${result.error}\n`);
    }
  }
  
  throw new Error('No working database connection found!');
}

async function setupDatabase(workingConfig) {
  console.log('🏗️ SETTING UP DATABASE WITH WORKING CONNECTION...\n');
  
  const pool = new Pool(workingConfig);
  const client = await pool.connect();
  
  try {
    // Step 1: Create basic tables
    console.log('📋 Step 1: Creating basic user and post tables...');
    await client.query(`
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create posts table
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        community_id INTEGER,
        sub_club_id INTEGER,
        is_draft BOOLEAN DEFAULT FALSE,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        share_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create post_votes table
      CREATE TABLE IF NOT EXISTS post_votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
      );
    `);
    console.log('✅ Basic tables created\n');

    // Step 2: Create community system
    console.log('🏘️ Step 2: Creating community system...');
    await client.query(`
      -- Create communities table
      CREATE TABLE IF NOT EXISTS communities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
        type VARCHAR(20) NOT NULL DEFAULT 'agnostic' CHECK (type IN ('location_bound', 'agnostic')),
        location VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        radius_km INTEGER DEFAULT 5 CHECK (radius_km >= 1 AND radius_km <= 100),
        pin_code VARCHAR(10),
        creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tags TEXT[],
        member_count INTEGER DEFAULT 0,
        post_count INTEGER DEFAULT 0,
        subclub_count INTEGER DEFAULT 0,
        last_active TIMESTAMP DEFAULT NOW(),
        rules TEXT[],
        banner_url TEXT,
        icon_url TEXT,
        allow_subclub_requests BOOLEAN DEFAULT true,
        auto_approve_subclubs BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create community_memberships table
      CREATE TABLE IF NOT EXISTS community_memberships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
        sub_club_id INTEGER,
        role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'creator', 'admin')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned', 'suspended')),
        permissions TEXT[],
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, community_id)
      );
    `);
    console.log('✅ Community system created\n');

    // Step 3: Create compatibility views
    console.log('🔗 Step 3: Creating compatibility views...');
    await client.query(`DROP VIEW IF EXISTS memberships CASCADE`);
    await client.query(`
      CREATE VIEW memberships AS
      SELECT 
        id,
        user_id,
        community_id,
        role,
        status,
        joined_at,
        updated_at
      FROM community_memberships
      WHERE community_id IS NOT NULL
    `);

    await client.query(`DROP VIEW IF EXISTS votes CASCADE`);
    await client.query(`
      CREATE VIEW votes AS
      SELECT 
        id,
        user_id,
        post_id,
        vote_type,
        created_at
      FROM post_votes
    `);
    console.log('✅ Compatibility views created\n');

    // Step 4: Insert sample data
    console.log('🎯 Step 4: Creating sample data...');
    await client.query(`
      -- Insert sample users
      INSERT INTO users (username, email, password) VALUES 
      ('admin', 'admin@notorix.com', 'admin123'),
      ('johnsmith', 'john@example.com', 'password123'),
      ('sarah_dev', 'sarah@notorix.com', 'dev456'),
      ('react_enthusiast', 'react@example.com', 'react123'),
      ('ui_designer', 'ui@example.com', 'design123')
      ON CONFLICT (username) DO NOTHING;

      -- Insert sample communities
      INSERT INTO communities (name, description, visibility, type, creator_id, member_count, post_count, last_active) VALUES
      ('Tech Innovators', 'A community for technology enthusiasts and innovators', 'public', 'agnostic', 1, 150, 45, NOW() - INTERVAL '2 hours'),
      ('Gaming Community', 'For gamers of all types and platforms', 'public', 'agnostic', 1, 220, 67, NOW() - INTERVAL '1 hour'),
      ('Local Photography', 'Photography enthusiasts in the area', 'public', 'location_bound', 1, 75, 28, NOW() - INTERVAL '1 day'),
      ('Book Club', 'Monthly book discussions and recommendations', 'public', 'agnostic', 1, 32, 12, NOW() - INTERVAL '3 days'),
      ('Fitness Motivation', 'Stay motivated on your fitness journey', 'public', 'agnostic', 1, 180, 89, NOW() - INTERVAL '5 hours')
      ON CONFLICT (name) DO NOTHING;

      -- Insert sample posts
      INSERT INTO posts (title, content, author, community_id, upvotes, downvotes, share_count, comment_count) VALUES
      ('Welcome to Notorix', 'This is the first post on our new platform! Welcome everyone to Notorix community.', 1, 1, 45, 2, 12, 8),
      ('Getting Started Guide', 'Here are some tips to get started with Notorix and make the most of your experience.', 1, 1, 67, 1, 23, 15),
      ('My First Post', 'Hello everyone! Excited to be part of this community.', 2, 2, 23, 0, 5, 3),
      ('Development Updates', 'Working on some exciting new features for the platform.', 3, 1, 89, 3, 34, 22),
      ('Community Guidelines', 'Please be respectful and follow our community guidelines for a better experience.', 1, 1, 156, 4, 67, 45)
      ON CONFLICT DO NOTHING;

      -- Insert sample memberships
      INSERT INTO community_memberships (user_id, community_id, role, status) VALUES
      (1, 1, 'creator', 'active'),
      (1, 2, 'creator', 'active'),
      (1, 3, 'creator', 'active'),
      (2, 1, 'member', 'active'),
      (3, 1, 'member', 'active'),
      (4, 2, 'member', 'active'),
      (5, 3, 'member', 'active')
      ON CONFLICT (user_id, community_id) DO NOTHING;
    `);
    console.log('✅ Sample data created\n');

    // Step 5: Create indexes for performance
    console.log('⚡ Step 5: Creating performance indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_communities_member_count ON communities(member_count DESC);
      CREATE INDEX IF NOT EXISTS idx_communities_post_count ON communities(post_count DESC);
      CREATE INDEX IF NOT EXISTS idx_communities_last_active ON communities(last_active DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id);
      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
      CREATE INDEX IF NOT EXISTS idx_memberships_community ON community_memberships(community_id);
      CREATE INDEX IF NOT EXISTS idx_memberships_user ON community_memberships(user_id);
    `);
    console.log('✅ Performance indexes created\n');

    // Final verification
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM communities) as total_communities,
        (SELECT COUNT(*) FROM community_memberships) as total_memberships,
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM users) as total_users
    `);

    const counts = stats.rows[0];
    console.log('📊 DATABASE SETUP COMPLETE!');
    console.log(`   🏘️ Communities: ${counts.total_communities}`);
    console.log(`   👥 Memberships: ${counts.total_memberships}`);
    console.log(`   📝 Posts: ${counts.total_posts}`);
    console.log(`   👤 Users: ${counts.total_users}\n`);

    return workingConfig;

  } finally {
    client.release();
    await pool.end();
  }
}

async function updateDbConfig(workingConfig) {
  console.log('📝 UPDATING DATABASE CONFIGURATION FILES...\n');
  
  // Update db.js with working configuration
  const dbJsContent = `// backend/db.js - PostgreSQL Database Configuration
const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

// PostgreSQL connection configuration (auto-detected working config)
const poolConfig = {
  user: '${workingConfig.user}',
  password: '${workingConfig.password}',
  host: process.env.NODE_ENV === 'production' ? 'db' : 'localhost',
  port: 5432,
  database: 'notorix',
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500,
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
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    const connectionTime = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Database connection successful!',
      data: {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].postgres_version,
        connectionTime: \`\${connectionTime}ms\`,
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

process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = {
  pool,
  testConnection,
  closePool
};`;

  fs.writeFileSync(path.join(__dirname, 'db.js'), dbJsContent);
  
  // Update config.env
  const configContent = `PORT=3001
MONGODB_URI=mongodb://localhost:27017/notorix
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development 
DATABASE_URL=postgresql://${workingConfig.user}:${workingConfig.password}@localhost:5432/notorix`;

  fs.writeFileSync(path.join(__dirname, 'config.env'), configContent);
  
  console.log('✅ Configuration files updated\n');
}

async function fixBackendComplete() {
  try {
    console.log('🚀 COMPREHENSIVE BACKEND FIX STARTING...\n');
    console.log('='*60);
    
    // Step 1: Find working database connection
    const workingConfig = await findWorkingConnection();
    
    // Step 2: Setup database with working connection
    await setupDatabase(workingConfig);
    
    // Step 3: Update configuration files
    await updateDbConfig(workingConfig);
    
    console.log('='*60);
    console.log('🎉 BACKEND FIX COMPLETED SUCCESSFULLY!\n');
    console.log('✅ Database connection: WORKING');
    console.log('✅ All tables created: YES');
    console.log('✅ Sample data inserted: YES');
    console.log('✅ Configuration updated: YES');
    console.log('✅ Compatibility views: CREATED\n');
    
    console.log('🚀 READY TO START BACKEND SERVER!');
    console.log('   Run: node server.js');
    console.log('   API will be available at: http://localhost:3001\n');
    
  } catch (error) {
    console.error('❌ BACKEND FIX FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the complete fix
fixBackendComplete(); 