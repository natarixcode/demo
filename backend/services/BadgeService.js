const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'notorix'
});

class BadgeService {
  
  /**
   * Evaluate and award badges for a user based on their activity
   * @param {number} userId - The user ID
   * @param {string} activityType - Type of activity (posts, comments, votes, etc.)
   * @param {object} activityData - Additional data about the activity
   */
  static async evaluateBadges(userId, activityType, activityData = {}) {
    const client = await pool.connect();
    
    try {
      console.log(`🏆 Evaluating badges for user ${userId} - activity: ${activityType}`);
      
      // Get all badges that could potentially be awarded
      const badges = await client.query('SELECT * FROM badges');
      
      // Get user's current statistics
      const userStats = await this.getUserStats(client, userId);
      
      // Check each badge condition
      for (const badge of badges.rows) {
        const condition = JSON.parse(badge.trigger_condition);
        const meetsCondition = await this.checkBadgeCondition(client, userId, condition, userStats, activityData);
        
        if (meetsCondition) {
          const awarded = await this.awardBadge(client, userId, badge.id);
          if (awarded) {
            console.log(`✅ Awarded badge "${badge.name}" to user ${userId}`);
            // TODO: Add notification system here
          }
        }
      }
      
    } catch (error) {
      console.error('Error evaluating badges:', error);
    } finally {
      client.release();
    }
  }
  
  /**
   * Get comprehensive user statistics for badge evaluation
   */
  static async getUserStats(client, userId) {
    const stats = {};
    
    try {
      // Post statistics
      const postStats = await client.query(`
        SELECT 
          COUNT(*) as total_posts,
          COALESCE(SUM(upvotes), 0) as total_post_upvotes,
          COALESCE(MAX(upvotes), 0) as max_post_upvotes
        FROM posts 
        WHERE author = $1
      `, [userId]);
      
      // Comment statistics  
      const commentStats = await client.query(`
        SELECT 
          COUNT(*) as total_comments,
          COALESCE(SUM(upvotes), 0) as total_comment_upvotes
        FROM comments 
        WHERE author = $1
      `, [userId]);
      
      // Vote statistics
      const voteStats = await client.query(`
        SELECT COUNT(*) as total_votes FROM post_votes WHERE user_id = $1
      `, [userId]);
      
      // Share statistics
      const shareStats = await client.query(`
        SELECT COUNT(*) as total_shares FROM post_shares WHERE user_id = $1
      `, [userId]);
      
      // Community statistics
      const communityStats = await client.query(`
        SELECT COUNT(*) as communities_created FROM communities WHERE creator_id = $1
      `, [userId]);
      
      // User info
      const userInfo = await client.query(`
        SELECT id, created_at FROM users WHERE id = $1
      `, [userId]);
      
      stats.posts = parseInt(postStats.rows[0]?.total_posts || 0);
      stats.post_upvotes = parseInt(postStats.rows[0]?.total_post_upvotes || 0);
      stats.max_post_upvotes = parseInt(postStats.rows[0]?.max_post_upvotes || 0);
      stats.comments = parseInt(commentStats.rows[0]?.total_comments || 0);
      stats.comment_upvotes = parseInt(commentStats.rows[0]?.total_comment_upvotes || 0);
      stats.votes = parseInt(voteStats.rows[0]?.total_votes || 0);
      stats.shares = parseInt(shareStats.rows[0]?.total_shares || 0);
      stats.communities_created = parseInt(communityStats.rows[0]?.communities_created || 0);
      stats.user_id = userId;
      stats.created_at = userInfo.rows[0]?.created_at;
      
      return stats;
      
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {};
    }
  }
  
  /**
   * Check if a user meets the condition for a specific badge
   */
  static async checkBadgeCondition(client, userId, condition, userStats, activityData) {
    try {
      // Check each condition type
      for (const [key, value] of Object.entries(condition)) {
        switch (key) {
          case 'posts':
            if (userStats.posts < value) return false;
            break;
            
          case 'comments':
            if (userStats.comments < value) return false;
            break;
            
          case 'votes':
            if (userStats.votes < value) return false;
            break;
            
          case 'shares':
            if (userStats.shares < value) return false;
            break;
            
          case 'post_upvotes':
            if (userStats.max_post_upvotes < value) return false;
            break;
            
          case 'comment_upvotes':
            if (userStats.comment_upvotes < value) return false;
            break;
            
          case 'communities_created':
            if (userStats.communities_created < value) return false;
            break;
            
          case 'user_id_under':
            if (userId >= value) return false;
            break;
            
          case 'community_members':
            // Check if user has a community with specified member count
            const communityCheck = await client.query(`
              SELECT COUNT(*) as member_count 
              FROM memberships m
              JOIN communities c ON m.community_id = c.id
              WHERE c.creator_id = $1
              GROUP BY c.id
              HAVING COUNT(*) >= $2
              LIMIT 1
            `, [userId, value]);
            if (communityCheck.rows.length === 0) return false;
            break;
            
          case 'daily_visits':
            // TODO: Implement daily visit tracking
            // For now, return false as this requires visit tracking
            return false;
            
          default:
            console.warn(`Unknown badge condition: ${key}`);
            return false;
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('Error checking badge condition:', error);
      return false;
    }
  }
  
  /**
   * Award a badge to a user if they don't already have it
   */
  static async awardBadge(client, userId, badgeId) {
    try {
      // Check if user already has this badge
      const existingBadge = await client.query(`
        SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2
      `, [userId, badgeId]);
      
      if (existingBadge.rows.length > 0) {
        return false; // User already has this badge
      }
      
      // Award the badge
      await client.query(`
        INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)
      `, [userId, badgeId]);
      
      // Update user karma (each badge gives 10 karma points)
      await client.query(`
        UPDATE users SET karma = COALESCE(karma, 0) + 10 WHERE id = $1
      `, [userId]);
      
      return true;
      
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  }
  
  /**
   * Get all badges for a specific user
   */
  static async getUserBadges(userId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          b.id,
          b.name,
          b.description,
          b.icon_url,
          b.badge_type,
          ub.awarded_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.awarded_at DESC
      `, [userId]);
      
      return result.rows;
      
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    } finally {
      client.release();
    }
  }
  
  /**
   * Get badge statistics and leaderboard
   */
  static async getBadgeStats() {
    const client = await pool.connect();
    
    try {
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
      
      const topUsers = await client.query(`
        SELECT 
          u.username,
          u.karma,
          COUNT(ub.badge_id) as badge_count
        FROM users u
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        GROUP BY u.id, u.username, u.karma
        ORDER BY badge_count DESC, u.karma DESC
        LIMIT 10
      `);
      
      return {
        badgeStats: badgeStats.rows,
        topUsers: topUsers.rows
      };
      
    } catch (error) {
      console.error('Error getting badge stats:', error);
      return { badgeStats: [], topUsers: [] };
    } finally {
      client.release();
    }
  }
  
  /**
   * Trigger badge evaluation for specific activities
   */
  static async onPostCreated(userId, postData) {
    await this.evaluateBadges(userId, 'post_created', postData);
  }
  
  static async onCommentCreated(userId, commentData) {
    await this.evaluateBadges(userId, 'comment_created', commentData);
  }
  
  static async onVoteCast(userId, voteData) {
    await this.evaluateBadges(userId, 'vote_cast', voteData);
  }
  
  static async onPostShared(userId, shareData) {
    await this.evaluateBadges(userId, 'post_shared', shareData);
  }
  
  static async onCommunityCreated(userId, communityData) {
    await this.evaluateBadges(userId, 'community_created', communityData);
  }
  
  static async onPostUpvoted(authorId, upvoteData) {
    await this.evaluateBadges(authorId, 'post_upvoted', upvoteData);
  }
  
  static async onCommentUpvoted(authorId, upvoteData) {
    await this.evaluateBadges(authorId, 'comment_upvoted', upvoteData);
  }
}

module.exports = BadgeService; 