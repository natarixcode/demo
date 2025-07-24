const { pool } = require('../db');

class Membership {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.community_id = data.community_id;
    this.sub_club_id = data.sub_club_id;
    this.role = data.role || 'member';
    this.status = data.status || 'active';
    this.joined_at = data.joined_at;
    this.updated_at = data.updated_at;
  }

  // Join a community
  static async joinCommunity(userId, communityId, message = null) {
    try {
      // Check if community exists
      const communityCheck = await pool.query('SELECT visibility FROM communities WHERE id = $1', [communityId]);
      
      if (communityCheck.rows.length === 0) {
        throw new Error('Community not found');
      }

      const community = communityCheck.rows[0];

      // Check if user is already a member
      const existingMembership = await pool.query(
        'SELECT * FROM community_memberships WHERE user_id = $1 AND community_id = $2',
        [userId, communityId]
      );

      if (existingMembership.rows.length > 0) {
        throw new Error('User is already a member of this community');
      }

      // For public communities, join directly
      if (community.visibility === 'public') {
        const result = await pool.query(
          'INSERT INTO community_memberships (user_id, community_id, role, status) VALUES ($1, $2, $3, $4) RETURNING *',
          [userId, communityId, 'member', 'active']
        );
        
        return new Membership(result.rows[0]);
      } else {
        // For private communities, create a join request
        const existingRequest = await pool.query(
          'SELECT * FROM join_requests WHERE user_id = $1 AND community_id = $2 AND status = $3',
          [userId, communityId, 'pending']
        );

        if (existingRequest.rows.length > 0) {
          throw new Error('Join request already pending');
        }

        const result = await pool.query(
          'INSERT INTO join_requests (user_id, community_id, message) VALUES ($1, $2, $3) RETURNING *',
          [userId, communityId, message]
        );

        return { type: 'join_request', data: result.rows[0] };
      }
    } catch (error) {
      throw new Error(`Failed to join community: ${error.message}`);
    }
  }

  // Join a sub-club
  static async joinSubClub(userId, subClubId, message = null) {
    try {
      // Check if sub-club exists and get community info
      const subClubCheck = await pool.query(
        'SELECT sc.visibility, sc.community_id FROM sub_clubs sc WHERE sc.id = $1',
        [subClubId]
      );
      
      if (subClubCheck.rows.length === 0) {
        throw new Error('Sub-club not found');
      }

      const subClub = subClubCheck.rows[0];

      // Check if user is a member of the parent community
      const communityMembership = await pool.query(
        'SELECT * FROM community_memberships WHERE user_id = $1 AND community_id = $2 AND status = $3',
        [userId, subClub.community_id, 'active']
      );

      if (communityMembership.rows.length === 0) {
        throw new Error('You must be a member of the parent community to join this sub-club');
      }

      // Check if user is already a member of the sub-club
      const existingMembership = await pool.query(
        'SELECT * FROM community_memberships WHERE user_id = $1 AND sub_club_id = $2',
        [userId, subClubId]
      );

      if (existingMembership.rows.length > 0) {
        throw new Error('User is already a member of this sub-club');
      }

      // For public sub-clubs, join directly
      if (subClub.visibility === 'public') {
        const result = await pool.query(
          'INSERT INTO community_memberships (user_id, sub_club_id, role, status) VALUES ($1, $2, $3, $4) RETURNING *',
          [userId, subClubId, 'member', 'active']
        );
        
        return new Membership(result.rows[0]);
      } else {
        // For private sub-clubs, create a join request
        const existingRequest = await pool.query(
          'SELECT * FROM join_requests WHERE user_id = $1 AND sub_club_id = $2 AND status = $3',
          [userId, subClubId, 'pending']
        );

        if (existingRequest.rows.length > 0) {
          throw new Error('Join request already pending');
        }

        const result = await pool.query(
          'INSERT INTO join_requests (user_id, sub_club_id, message) VALUES ($1, $2, $3) RETURNING *',
          [userId, subClubId, message]
        );

        return { type: 'join_request', data: result.rows[0] };
      }
    } catch (error) {
      throw new Error(`Failed to join sub-club: ${error.message}`);
    }
  }

  // Leave a community
  static async leaveCommunity(userId, communityId) {
    try {
      // Check if user is a member
      const membership = await pool.query(
        'SELECT * FROM community_memberships WHERE user_id = $1 AND community_id = $2',
        [userId, communityId]
      );

      if (membership.rows.length === 0) {
        throw new Error('User is not a member of this community');
      }

      // Creators cannot leave their own community
      if (membership.rows[0].role === 'creator') {
        throw new Error('Creators cannot leave their own community');
      }

      // Remove membership
      await pool.query(
        'DELETE FROM community_memberships WHERE user_id = $1 AND community_id = $2',
        [userId, communityId]
      );

      // Also remove from all sub-clubs in this community
      await pool.query(`
        DELETE FROM community_memberships 
        WHERE user_id = $1 AND sub_club_id IN (
          SELECT id FROM sub_clubs WHERE community_id = $2
        )
      `, [userId, communityId]);

      return true;
    } catch (error) {
      throw new Error(`Failed to leave community: ${error.message}`);
    }
  }

  // Leave a sub-club
  static async leaveSubClub(userId, subClubId) {
    try {
      // Check if user is a member
      const membership = await pool.query(
        'SELECT * FROM community_memberships WHERE user_id = $1 AND sub_club_id = $2',
        [userId, subClubId]
      );

      if (membership.rows.length === 0) {
        throw new Error('User is not a member of this sub-club');
      }

      // Creators cannot leave their own sub-club
      if (membership.rows[0].role === 'creator') {
        throw new Error('Creators cannot leave their own sub-club');
      }

      // Remove membership
      await pool.query(
        'DELETE FROM community_memberships WHERE user_id = $1 AND sub_club_id = $2',
        [userId, subClubId]
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to leave sub-club: ${error.message}`);
    }
  }

  // Handle join request (approve/reject)
  static async handleJoinRequest(requestId, action, reviewerId) {
    try {
      if (!['approved', 'rejected'].includes(action)) {
        throw new Error('Invalid action. Must be "approved" or "rejected"');
      }

      // Get the join request
      const request = await pool.query(
        'SELECT * FROM join_requests WHERE id = $1 AND status = $2',
        [requestId, 'pending']
      );

      if (request.rows.length === 0) {
        throw new Error('Join request not found or already processed');
      }

      const joinRequest = request.rows[0];

      // Check if reviewer has permission
      let hasPermission = false;
      if (joinRequest.community_id) {
        const permission = await pool.query(
          'SELECT role FROM community_memberships WHERE community_id = $1 AND user_id = $2 AND role IN ($3, $4)',
          [joinRequest.community_id, reviewerId, 'creator', 'moderator']
        );
        hasPermission = permission.rows.length > 0;
      } else if (joinRequest.sub_club_id) {
        const permission = await pool.query(
          'SELECT role FROM community_memberships WHERE sub_club_id = $1 AND user_id = $2 AND role IN ($3, $4)',
          [joinRequest.sub_club_id, reviewerId, 'creator', 'moderator']
        );
        hasPermission = permission.rows.length > 0;
      }

      if (!hasPermission) {
        throw new Error('Insufficient permissions to handle this request');
      }

      // Update the request status
      await pool.query(
        'UPDATE join_requests SET status = $1, reviewed_at = $2, reviewed_by = $3 WHERE id = $4',
        [action, new Date(), reviewerId, requestId]
      );

      // If approved, create membership
      if (action === 'approved') {
        if (joinRequest.community_id) {
          const result = await pool.query(
            'INSERT INTO community_memberships (user_id, community_id, role, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [joinRequest.user_id, joinRequest.community_id, 'member', 'active']
          );
          return new Membership(result.rows[0]);
        } else if (joinRequest.sub_club_id) {
          const result = await pool.query(
            'INSERT INTO community_memberships (user_id, sub_club_id, role, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [joinRequest.user_id, joinRequest.sub_club_id, 'member', 'active']
          );
          return new Membership(result.rows[0]);
        }
      }

      return { action, requestId };
    } catch (error) {
      throw new Error(`Failed to handle join request: ${error.message}`);
    }
  }

  // Get pending join requests for a community/sub-club
  static async getPendingRequests(entityId, entityType, userId) {
    try {
      // Check if user has permission to view requests
      let hasPermission = false;
      if (entityType === 'community') {
        const permission = await pool.query(
          'SELECT role FROM community_memberships WHERE community_id = $1 AND user_id = $2 AND role IN ($3, $4)',
          [entityId, userId, 'creator', 'moderator']
        );
        hasPermission = permission.rows.length > 0;
      } else if (entityType === 'sub_club') {
        const permission = await pool.query(
          'SELECT role FROM community_memberships WHERE sub_club_id = $1 AND user_id = $2 AND role IN ($3, $4)',
          [entityId, userId, 'creator', 'moderator']
        );
        hasPermission = permission.rows.length > 0;
      }

      if (!hasPermission) {
        throw new Error('Insufficient permissions to view join requests');
      }

      const column = entityType === 'community' ? 'community_id' : 'sub_club_id';
      const query = `
        SELECT jr.*, u.username, u.email
        FROM join_requests jr
        JOIN users u ON jr.user_id = u.id
        WHERE jr.${column} = $1 AND jr.status = $2
        ORDER BY jr.requested_at ASC
      `;

      const result = await pool.query(query, [entityId, 'pending']);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch join requests: ${error.message}`);
    }
  }

  // Update member role
  static async updateMemberRole(membershipId, newRole, updaterId) {
    try {
      if (!['member', 'moderator'].includes(newRole)) {
        throw new Error('Invalid role. Must be "member" or "moderator"');
      }

      // Get the membership
      const membership = await pool.query(
        'SELECT * FROM community_memberships WHERE id = $1',
        [membershipId]
      );

      if (membership.rows.length === 0) {
        throw new Error('Membership not found');
      }

      const membershipData = membership.rows[0];

      // Check if updater has permission
      let hasPermission = false;
      if (membershipData.community_id) {
        const permission = await pool.query(
          'SELECT role FROM community_memberships WHERE community_id = $1 AND user_id = $2 AND role = $3',
          [membershipData.community_id, updaterId, 'creator']
        );
        hasPermission = permission.rows.length > 0;
      } else if (membershipData.sub_club_id) {
        const permission = await pool.query(
          'SELECT role FROM community_memberships WHERE sub_club_id = $1 AND user_id = $2 AND role = $3',
          [membershipData.sub_club_id, updaterId, 'creator']
        );
        hasPermission = permission.rows.length > 0;
      }

      if (!hasPermission) {
        throw new Error('Only creators can update member roles');
      }

      // Cannot change creator role
      if (membershipData.role === 'creator') {
        throw new Error('Cannot change creator role');
      }

      // Update the role
      const result = await pool.query(
        'UPDATE community_memberships SET role = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        [newRole, new Date(), membershipId]
      );

      return new Membership(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }
  }

  // Remove member (ban/kick)
  static async removeMember(membershipId, removerId) {
    try {
      // Get the membership
      const membership = await pool.query(
        'SELECT * FROM community_memberships WHERE id = $1',
        [membershipId]
      );

      if (membership.rows.length === 0) {
        throw new Error('Membership not found');
      }

      const membershipData = membership.rows[0];

      // Check if remover has permission
      let hasPermission = false;
      if (membershipData.community_id) {
        const permission = await pool.query(
          'SELECT role FROM community_memberships WHERE community_id = $1 AND user_id = $2 AND role IN ($3, $4)',
          [membershipData.community_id, removerId, 'creator', 'moderator']
        );
        hasPermission = permission.rows.length > 0;
      } else if (membershipData.sub_club_id) {
        const permission = await pool.query(
          'SELECT role FROM community_memberships WHERE sub_club_id = $1 AND user_id = $2 AND role IN ($3, $4)',
          [membershipData.sub_club_id, removerId, 'creator', 'moderator']
        );
        hasPermission = permission.rows.length > 0;
      }

      if (!hasPermission) {
        throw new Error('Insufficient permissions to remove member');
      }

      // Cannot remove creator
      if (membershipData.role === 'creator') {
        throw new Error('Cannot remove creator');
      }

      // Remove the membership
      await pool.query('DELETE FROM community_memberships WHERE id = $1', [membershipId]);

      return true;
    } catch (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }
}

module.exports = Membership; 