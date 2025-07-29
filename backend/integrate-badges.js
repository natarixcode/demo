const BadgeService = require('./services/BadgeService');

async function testBadgeIntegration() {
  console.log('🧪 Testing Badge System Integration...\n');
  
  try {
    // Test badge evaluation for user 1
    console.log('1. Testing badge evaluation for user 1...');
    await BadgeService.onPostCreated(1, { title: 'Test Post' });
    await BadgeService.onCommentCreated(1, { content: 'Test Comment' });
    await BadgeService.onVoteCast(1, { vote_type: 'upvote' });
    await BadgeService.onPostShared(1, { post_id: 1 });
    
    // Get user badges
    console.log('2. Getting user badges...');
    const userBadges = await BadgeService.getUserBadges(1);
    console.log(`✅ User 1 has ${userBadges.length} badges:`);
    userBadges.forEach(badge => {
      console.log(`   - ${badge.name}: ${badge.description}`);
    });
    
    // Get badge statistics
    console.log('\n3. Getting badge statistics...');
    const stats = await BadgeService.getBadgeStats();
    console.log('📊 Badge Statistics:');
    stats.badgeStats.slice(0, 5).forEach(stat => {
      console.log(`   ${stat.name}: ${stat.awarded_count} users`);
    });
    
    console.log('\n🏆 Top Users:');
    stats.topUsers.slice(0, 3).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username}: ${user.badge_count} badges, ${user.karma} karma`);
    });
    
    console.log('\n🎉 Badge system integration test complete!');
    
  } catch (error) {
    console.error('❌ Error testing badge integration:', error);
  }
}

testBadgeIntegration(); 