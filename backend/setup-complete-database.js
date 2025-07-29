// backend/setup-complete-database.js - Complete Database Setup for Community Nexus
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function setupCompleteDatabase() {
  try {
    console.log('🚀 Starting Complete Database Setup for Community Nexus...\n');
    
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database\n');
    
    try {
      // Step 1: Create basic tables
      console.log('📋 Step 1: Creating basic tables...');
      const basicTablesSQL = fs.readFileSync(path.join(__dirname, 'create-tables.sql'), 'utf8');
      await client.query(basicTablesSQL);
      console.log('✅ Basic tables created\n');

      // Step 2: Create enhanced community system
      console.log('🏘️ Step 2: Creating enhanced community system...');
      const enhancedCommunitySQL = fs.readFileSync(path.join(__dirname, 'create-enhanced-community-system.sql'), 'utf8');
      await client.query(enhancedCommunitySQL);
      console.log('✅ Enhanced community system created\n');

      // Step 3: Create Community Discovery enhancements
      console.log('🔍 Step 3: Adding Community Discovery enhancements...');
      const discoverySQL = fs.readFileSync(path.join(__dirname, 'create-community-discovery-fixed.sql'), 'utf8');
      await client.query(discoverySQL);
      console.log('✅ Discovery enhancements added\n');

      // Step 4: Create compatibility views and aliases
      console.log('🔗 Step 4: Creating compatibility layer...');
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
          CASE 
            WHEN vote_type = 'upvote' THEN 'upvote'
            WHEN vote_type = 'downvote' THEN 'downvote'
          END as vote_type,
          created_at
        FROM post_votes
      `);
      console.log('✅ Compatibility layer created\n');

      // Step 5: Update existing communities with discovery data
      console.log('📊 Step 5: Updating existing communities with metrics...');
      await client.query(`
        -- Update member_count for existing communities
        UPDATE communities 
        SET member_count = COALESCE(
          (SELECT COUNT(*) FROM community_memberships WHERE community_id = communities.id AND status = 'active'), 
          0
        )
        WHERE member_count IS NULL OR member_count = 0;

        -- Update post_count for existing communities
        UPDATE communities 
        SET post_count = COALESCE(
          (SELECT COUNT(*) FROM posts WHERE community_id = communities.id), 
          0
        )
        WHERE post_count IS NULL OR post_count = 0;

        -- Update last_active for existing communities
        UPDATE communities 
        SET last_active = COALESCE(
          (SELECT MAX(created_at) FROM posts WHERE community_id = communities.id),
          created_at,
          NOW()
        )
        WHERE last_active IS NULL;
      `);
      console.log('✅ Community metrics updated\n');

      // Step 6: Create some sample data for testing
      console.log('🎯 Step 6: Creating sample data for testing...');
      await client.query(`
        -- Insert sample communities if they don't exist
        INSERT INTO communities (name, description, visibility, type, location, latitude, longitude, creator_id, member_count, post_count, last_active) VALUES
        ('Gaming Community', 'For gamers of all types and platforms', 'public', 'agnostic', NULL, NULL, NULL, 1, 150, 45, NOW() - INTERVAL '2 hours'),
        ('Local Photography', 'Photography enthusiasts in the area', 'public', 'location_bound', 'San Francisco, CA', 37.7749, -122.4194, 1, 75, 28, NOW() - INTERVAL '1 day'),
        ('Book Club', 'Monthly book discussions and recommendations', 'public', 'agnostic', NULL, NULL, NULL, 1, 32, 12, NOW() - INTERVAL '3 days'),
        ('Fitness Motivation', 'Stay motivated on your fitness journey', 'public', 'agnostic', NULL, NULL, NULL, 1, 220, 89, NOW() - INTERVAL '5 hours'),
        ('Local Events NYC', 'Events and meetups in New York City', 'public', 'location_bound', 'New York, NY', 40.7128, -74.0060, 1, 180, 67, NOW() - INTERVAL '30 minutes')
        ON CONFLICT (name) DO NOTHING;

        -- Insert sample memberships
        INSERT INTO community_memberships (user_id, community_id, role, status) 
        SELECT 1, id, 'creator', 'active' 
        FROM communities 
        WHERE creator_id = 1
        ON CONFLICT (user_id, community_id) DO NOTHING;

        -- Add some regular members
        INSERT INTO community_memberships (user_id, community_id, role, status) VALUES
        (2, 1, 'member', 'active'),
        (3, 1, 'member', 'active'),
        (4, 1, 'member', 'active'),
        (2, 2, 'member', 'active'),
        (3, 2, 'member', 'active'),
        (2, 3, 'member', 'active'),
        (4, 3, 'member', 'active'),
        (5, 3, 'member', 'active')
        ON CONFLICT (user_id, community_id) DO NOTHING;
      `);
      console.log('✅ Sample data created\n');

      // Step 7: Test the Community Nexus API compatibility
      console.log('🧪 Step 7: Testing Community Nexus compatibility...');
      const testResult = await client.query(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.member_count,
          c.post_count,
          c.last_active,
          COUNT(m.id) as actual_members
        FROM communities c
        LEFT JOIN memberships m ON c.id = m.community_id
        GROUP BY c.id, c.name, c.description, c.member_count, c.post_count, c.last_active
        LIMIT 5
      `);
      
      console.log('📊 Sample Communities:');
      testResult.rows.forEach(row => {
        console.log(`   • ${row.name}: ${row.member_count} members, ${row.post_count} posts`);
      });
      console.log('✅ Community Nexus compatibility verified\n');

      // Step 8: Create indexes for optimal performance
      console.log('⚡ Step 8: Creating performance indexes...');
      await client.query(`
        -- Create indexes for Community Nexus queries
        CREATE INDEX IF NOT EXISTS idx_communities_member_count ON communities(member_count DESC);
        CREATE INDEX IF NOT EXISTS idx_communities_post_count ON communities(post_count DESC);
        CREATE INDEX IF NOT EXISTS idx_communities_last_active ON communities(last_active DESC);
        CREATE INDEX IF NOT EXISTS idx_communities_trending_score ON communities((member_count + post_count * 2) DESC);
        CREATE INDEX IF NOT EXISTS idx_communities_location_coords ON communities(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_memberships_community_user ON community_memberships(community_id, user_id);
        CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON community_memberships(user_id, status);
      `);
      console.log('✅ Performance indexes created\n');

      // Final verification
      const finalStats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM communities) as total_communities,
          (SELECT COUNT(*) FROM community_memberships) as total_memberships,
          (SELECT COUNT(*) FROM posts) as total_posts,
          (SELECT COUNT(*) FROM users) as total_users
      `);

      const stats = finalStats.rows[0];
      console.log('📈 Final Database Statistics:');
      console.log(`   📊 Total Communities: ${stats.total_communities}`);
      console.log(`   👥 Total Memberships: ${stats.total_memberships}`);
      console.log(`   📝 Total Posts: ${stats.total_posts}`);
      console.log(`   👤 Total Users: ${stats.total_users}`);

    } finally {
      client.release();
    }
    
    console.log('\n🎉 Complete Database Setup Successful!');
    console.log('🧭 Community Nexus is ready to launch!');
    console.log('\n🌐 You can now access:');
    console.log('   • Community Nexus: http://localhost:5173/nexus');
    console.log('   • Nexus API: http://localhost:3001/api/nexus');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the complete setup
setupCompleteDatabase(); 