// backend/services/notificationService.js
const pool = require('../db');

/**
 * Notification Service
 * Handles creating notifications for various user actions
 */
class NotificationService {
  
  /**
   * Create a notification using the database function
   * @param {number} userId - Target user ID
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} content - Notification content
   * @param {number} senderId - User who triggered the notification
   * @param {number} relatedId - Related entity ID (post, comment, etc.)
   * @param {string} relatedType - Related entity type
   * @param {string} actionUrl - URL to navigate when clicked
   * @returns {Promise<number|null>} - Notification ID or null if not created
   */
  static async createNotification(userId, type, title, content, senderId = null, relatedId = null, relatedType = null, actionUrl = null) {
    try {
      const result = await pool.query(
        'SELECT create_notification($1, $2, $3, $4, $5, $6, $7, $8) as notification_id',
        [userId, type, title, content, senderId, relatedId, relatedType, actionUrl]
      );
      
      return result.rows[0].notification_id;
      
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Notify when someone comments on a post
   * @param {number} postId - Post ID
   * @param {number} postAuthorId - Post author ID
   * @param {number} commenterId - User who commented
   * @param {string} commenterName - Name of commenter
   * @param {string} postTitle - Title of the post
   */
  static async notifyPostComment(postId, postAuthorId, commenterId, commenterName, postTitle) {
    if (postAuthorId === commenterId) return; // Don't notify self
    
    try {
      const title = `💬 New comment on your post`;
      const content = `${commenterName} commented on "${postTitle.length > 50 ? postTitle.substring(0, 50) + '...' : postTitle}"`;
      const actionUrl = `/posts/${postId}`;
      
      return await this.createNotification(
        postAuthorId,
        'comment',
        title,
        content,
        commenterId,
        postId,
        'post',
        actionUrl
      );
      
    } catch (error) {
      console.error('Error creating post comment notification:', error);
    }
  }

  /**
   * Notify when someone replies to a comment
   * @param {number} originalCommentId - Original comment ID
   * @param {number} originalCommentAuthorId - Original comment author ID
   * @param {number} replierId - User who replied
   * @param {string} replierName - Name of replier
   * @param {number} postId - Post ID where comment exists
   */
  static async notifyCommentReply(originalCommentId, originalCommentAuthorId, replierId, replierName, postId) {
    if (originalCommentAuthorId === replierId) return; // Don't notify self
    
    try {
      const title = `💭 New reply to your comment`;
      const content = `${replierName} replied to your comment`;
      const actionUrl = `/posts/${postId}#comment-${originalCommentId}`;
      
      return await this.createNotification(
        originalCommentAuthorId,
        'reply',
        title,
        content,
        replierId,
        originalCommentId,
        'comment',
        actionUrl
      );
      
    } catch (error) {
      console.error('Error creating comment reply notification:', error);
    }
  }

  /**
   * Notify when someone joins a community
   * @param {number} communityId - Community ID
   * @param {number} communityCreatorId - Community creator ID
   * @param {number} joinerId - User who joined
   * @param {string} joinerName - Name of user who joined
   * @param {string} communityName - Name of the community
   */
  static async notifyCommunityJoin(communityId, communityCreatorId, joinerId, joinerName, communityName) {
    if (communityCreatorId === joinerId) return; // Don't notify self
    
    try {
      const title = `🏘️ New member joined your community`;
      const content = `${joinerName} joined "${communityName}"`;
      const actionUrl = `/communities/${communityId}`;
      
      return await this.createNotification(
        communityCreatorId,
        'join',
        title,
        content,
        joinerId,
        communityId,
        'community',
        actionUrl
      );
      
    } catch (error) {
      console.error('Error creating community join notification:', error);
    }
  }

  /**
   * Notify when someone likes a post
   * @param {number} postId - Post ID
   * @param {number} postAuthorId - Post author ID
   * @param {number} likerId - User who liked
   * @param {string} likerName - Name of user who liked
   * @param {string} postTitle - Title of the post
   */
  static async notifyPostLike(postId, postAuthorId, likerId, likerName, postTitle) {
    if (postAuthorId === likerId) return; // Don't notify self
    
    try {
      const title = `⭐ Someone liked your post`;
      const content = `${likerName} liked "${postTitle.length > 50 ? postTitle.substring(0, 50) + '...' : postTitle}"`;
      const actionUrl = `/posts/${postId}`;
      
      return await this.createNotification(
        postAuthorId,
        'like',
        title,
        content,
        likerId,
        postId,
        'post',
        actionUrl
      );
      
    } catch (error) {
      console.error('Error creating post like notification:', error);
    }
  }

  /**
   * Notify when someone mentions a user in a post or comment
   * @param {number} mentionedUserId - User who was mentioned
   * @param {number} mentionerId - User who mentioned
   * @param {string} mentionerName - Name of user who mentioned
   * @param {string} content - Content where mention occurred
   * @param {number} relatedId - Related post or comment ID
   * @param {string} relatedType - 'post' or 'comment'
   */
  static async notifyMention(mentionedUserId, mentionerId, mentionerName, content, relatedId, relatedType) {
    if (mentionedUserId === mentionerId) return; // Don't notify self
    
    try {
      const title = `@️⃣ You were mentioned`;
      const truncatedContent = content.length > 100 ? content.substring(0, 100) + '...' : content;
      const notificationContent = `${mentionerName} mentioned you: "${truncatedContent}"`;
      const actionUrl = relatedType === 'post' ? `/posts/${relatedId}` : `/posts/${relatedId}#comment`;
      
      return await this.createNotification(
        mentionedUserId,
        'mention',
        title,
        notificationContent,
        mentionerId,
        relatedId,
        relatedType,
        actionUrl
      );
      
    } catch (error) {
      console.error('Error creating mention notification:', error);
    }
  }

  /**
   * Notify when someone follows a user
   * @param {number} followedUserId - User who was followed
   * @param {number} followerId - User who followed
   * @param {string} followerName - Name of follower
   */
  static async notifyFollow(followedUserId, followerId, followerName) {
    if (followedUserId === followerId) return; // Don't notify self
    
    try {
      const title = `👤 New follower`;
      const content = `${followerName} started following you`;
      const actionUrl = `/profile/${followerId}`;
      
      return await this.createNotification(
        followedUserId,
        'follow',
        title,
        content,
        followerId,
        followerId,
        'user',
        actionUrl
      );
      
    } catch (error) {
      console.error('Error creating follow notification:', error);
    }
  }

  /**
   * Notify when someone invites a user to a community
   * @param {number} invitedUserId - User who was invited
   * @param {number} inviterId - User who sent invitation
   * @param {string} inviterName - Name of inviter
   * @param {number} communityId - Community ID
   * @param {string} communityName - Community name
   */
  static async notifyCommunityInvite(invitedUserId, inviterId, inviterName, communityId, communityName) {
    if (invitedUserId === inviterId) return; // Don't notify self
    
    try {
      const title = `📨 Community invitation`;
      const content = `${inviterName} invited you to join "${communityName}"`;
      const actionUrl = `/communities/${communityId}/invite`;
      
      return await this.createNotification(
        invitedUserId,
        'community_invite',
        title,
        content,
        inviterId,
        communityId,
        'community',
        actionUrl
      );
      
    } catch (error) {
      console.error('Error creating community invite notification:', error);
    }
  }

  /**
   * Send welcome notification to new users
   * @param {number} userId - New user ID
   * @param {string} username - New user's username
   */
  static async sendWelcomeNotification(userId, username) {
    try {
      const title = `🎉 Welcome to Natarix!`;
      const content = `Hi ${username}! Welcome to our community. Start exploring, join communities, and share your thoughts!`;
      const actionUrl = `/communities`;
      
      return await this.createNotification(
        userId,
        'join',
        title,
        content,
        null, // System notification
        null,
        'system',
        actionUrl
      );
      
    } catch (error) {
      console.error('Error creating welcome notification:', error);
    }
  }

  /**
   * Batch notify multiple users
   * @param {Array} notifications - Array of notification objects
   */
  static async createBatchNotifications(notifications) {
    try {
      const promises = notifications.map(notification => 
        this.createNotification(
          notification.userId,
          notification.type,
          notification.title,
          notification.content,
          notification.senderId,
          notification.relatedId,
          notification.relatedType,
          notification.actionUrl
        )
      );
      
      return await Promise.all(promises);
      
    } catch (error) {
      console.error('Error creating batch notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification count for user
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Unread notification count
   */
  static async getUnreadCount(userId) {
    try {
      const result = await pool.query('SELECT get_unread_count($1) as count', [userId]);
      return result.rows[0].count;
      
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Number of notifications marked as read
   */
  static async markAllAsRead(userId) {
    try {
      const result = await pool.query('SELECT mark_notifications_read($1) as affected_rows', [userId]);
      return result.rows[0].affected_rows;
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 