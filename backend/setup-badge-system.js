const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'notorix'
});

async function setupBadgeSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🏆 Setting up Badge & Achievement System...\n');
    
    // Create badges table
    console.log('1. Creating badges table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon_url TEXT,
        badge_type VARCHAR(50), -- milestone | community | behavior
        trigger_condition TEXT, -- JSON to describe condition
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Badges table created');
    
    // Create user_badges table
    console.log('2. Creating user_badges table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_id)
      )
    `);
    console.log('✅ User badges table created');
    
    // Clear existing badges for fresh setup
    await client.query('DELETE FROM user_badges');
    await client.query('DELETE FROM badges');
    
    // Seed initial badges
    console.log('3. Seeding initial badge data...');
    const initialBadges = [
      {
        name: '🥇 First Post',
        description: 'Awarded for creating your first post.',
        icon_url: '/badges/first-post.svg',
        badge_type: 'milestone',
        trigger_condition: JSON.stringify({posts: 1})
      },
      {
        name: '📝 Prolific Writer',
        description: 'Created 10 posts - you\'re getting the hang of this!',
        icon_url: '/badges/prolific-writer.svg', 
        badge_type: 'milestone',
        trigger_condition: JSON.stringify({posts: 10})
      },
      {
        name: '💬 First Comment',
        description: 'Welcome to the conversation! Your first comment.',
        icon_url: '/badges/first-comment.svg',
        badge_type: 'milestone', 
        trigger_condition: JSON.stringify({comments: 1})
      },
      {
        name: '🗣️ Chatty',
        description: 'You\'ve written 50 comments!',
        icon_url: '/badges/chatty.svg',
        badge_type: 'milestone',
        trigger_condition: JSON.stringify({comments: 50})
      },
      {
        name: '💯 Century Club',
        description: 'Amazing! You\'ve written 100 comments.',
        icon_url: '/badges/century-club.svg',
        badge_type: 'milestone',
        trigger_condition: JSON.stringify({comments: 100})
      },
      {
        name: '👍 First Vote',
        description: 'Cast your first vote on a post.',
        icon_url: '/badges/first-vote.svg',
        badge_type: 'milestone',
        trigger_condition: JSON.stringify({votes: 1})
      },
      {
        name: '🔥 Popular Post',
        description: 'One of your posts received 10+ upvotes!',
        icon_url: '/badges/popular-post.svg',
        badge_type: 'behavior',
        trigger_condition: JSON.stringify({post_upvotes: 10})
      },
      {
        name: '⭐ Rising Star',
        description: 'One of your posts received 25+ upvotes!',
        icon_url: '/badges/rising-star.svg',
        badge_type: 'behavior',
        trigger_condition: JSON.stringify({post_upvotes: 25})
      },
      {
        name: '🤝 Helper',
        description: 'Received 5 upvotes on your comments.',
        icon_url: '/badges/helper.svg',
        badge_type: 'behavior',
        trigger_condition: JSON.stringify({comment_upvotes: 5})
      },
      {
        name: '📤 Sharing is Caring',
        description: 'Shared your first post with others.',
        icon_url: '/badges/sharing.svg',
        badge_type: 'milestone',
        trigger_condition: JSON.stringify({shares: 1})
      },
      {
        name: '🏘️ Community Builder',
        description: 'Created your first community.',
        icon_url: '/badges/community-builder.svg',
        badge_type: 'community',
        trigger_condition: JSON.stringify({communities_created: 1})
      },
      {
        name: '👑 Community Leader',
        description: 'Your community reached 50 members!',
        icon_url: '/badges/community-leader.svg',
        badge_type: 'community',
        trigger_condition: JSON.stringify({community_members: 50})
      },
      {
        name: '🎯 Daily Visitor',
        description: 'Visited the platform 7 days in a row.',
        icon_url: '/badges/daily-visitor.svg',
        badge_type: 'behavior',
        trigger_condition: JSON.stringify({daily_visits: 7})
      },
      {
        name: '🚀 Early Adopter',
        description: 'One of the first 100 users on Notorix!',
        icon_url: '/badges/early-adopter.svg',
        badge_type: 'special',
        trigger_condition: JSON.stringify({user_id_under: 100})
      }
    ];
    
    for (const badge of initialBadges) {
      await client.query(`
        INSERT INTO badges (name, description, icon_url, badge_type, trigger_condition)
        VALUES ($1, $2, $3, $4, $5)
      `, [badge.name, badge.description, badge.icon_url, badge.badge_type, badge.trigger_condition]);
    }
    
    console.log(`✅ Seeded ${initialBadges.length} badges`);
    
    // Add karma column to users table for future use
    console.log('4. Adding karma system to users...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS karma INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_visit DATE DEFAULT CURRENT_DATE
    `);
    console.log('✅ Added karma and last_visit columns to users');
    
    // Create badge statistics view
    console.log('5. Creating badge statistics...');
    const badgeStats = await client.query(`
      SELECT 
        b.name,
        b.badge_type,
        COUNT(ub.user_id) as awarded_count
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id
      GROUP BY b.id, b.name, b.badge_type
      ORDER BY awarded_count DESC
    `);
    
    console.log('\n📊 Badge Statistics:');
    badgeStats.rows.forEach(stat => {
      console.log(`   ${stat.name}: ${stat.awarded_count} users`);
    });
    
    console.log('\n🎉 Badge System Setup Complete!');
    console.log('✅ Created badges and user_badges tables');
    console.log('✅ Seeded 14 initial badges');
    console.log('✅ Added karma system to users');
    console.log('✅ Ready for badge evaluation and awards');
    
  } catch (error) {
    console.error('❌ Error setting up badge system:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupBadgeSystem(); 