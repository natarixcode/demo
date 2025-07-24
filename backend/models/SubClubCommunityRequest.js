const { pool } = require('../db');

class SubClubCommunityRequest {
  constructor(data) {
    this.id = data.id;
    this.sub_club_id = data.sub_club_id;
    this.community_id = data.community_id;
    this.requested_by = data.requested_by;
    this.message = data.message;
    this.proposed_name = data.proposed_name;
    this.status = data.status || 'pending';
    this.requested_at = data.requested_at;
    this.reviewed_at = data.reviewed_at;
    this.reviewed_by = data.reviewed_by;
    this.review_message = data.review_message;
    
    // Additional fields from joins
    this.sub_club_name = data.sub_club_name;
    this.community_name = data.community_name;
    this.requester_username = data.requester_username;
    this.reviewer_username = data.reviewer_username;
  }

  // Create a new sub-club community request
  static async create(requestData) {
    const {
      sub_club_id,
      community_id,
      requested_by,
      message,
      proposed_name
    } = requestData;

    try {
      // Verify sub-club exists and is independent
      const subClubCheck = await pool.query(
        'SELECT * FROM sub_clubs WHERE id = $1 AND is_independent = true AND community_id IS NULL',
        [sub_club_id]
      );

      if (subClubCheck.rows.length === 0) {
        throw new Error('Sub-club not found or is not independent');
      }

      // Verify community exists and allows sub-club requests
      const communityCheck = await pool.query(
        'SELECT * FROM communities WHERE id = $1 AND allow_subclub_requests = true',
        [community_id]
      );

      if (communityCheck.rows.length === 0) {
        throw new Error('Community not found or does not allow sub-club requests');
      }

      // Verify requester is creator/admin of the sub-club
      const membershipCheck = await pool.query(
        'SELECT role FROM community_memberships WHERE user_id = $1 AND sub_club_id = $2 AND role IN ($3, $4)',
        [requested_by, sub_club_id, 'creator', 'admin']
      );

      if (membershipCheck.rows.length === 0) {
        throw new Error('Only sub-club creators or admins can request community addition');
      }

      // Check for existing request
      const existingRequest = await pool.query(
        'SELECT id FROM subclub_community_requests WHERE sub_club_id = $1 AND community_id = $2',
        [sub_club_id, community_id]
      );

      if (existingRequest.rows.length > 0) {
        throw new Error('A request for this sub-club to join this community already exists');
      }

      const query = `
        INSERT INTO subclub_community_requests (sub_club_id, community_id, requested_by, message, proposed_name)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [sub_club_id, community_id, requested_by, message, proposed_name];
      const result = await pool.query(query, values);
      
      return new SubClubCommunityRequest(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create sub-club community request: ${error.message}`);
    }
  }

  // Get all requests for a community (for community admins)
  static async getByCommunity(communityId, filters = {}) {
    try {
      let query = `
        SELECT scr.*, 
               sc.name as sub_club_name, sc.description as sub_club_description,
               sc.member_count, sc.tags as sub_club_tags,
               c.name as community_name,
               u_req.username as requester_username,
               u_rev.username as reviewer_username
        FROM subclub_community_requests scr
        JOIN sub_clubs sc ON scr.sub_club_id = sc.id
        JOIN communities c ON scr.community_id = c.id
        JOIN users u_req ON scr.requested_by = u_req.id
        LEFT JOIN users u_rev ON scr.reviewed_by = u_rev.id
        WHERE scr.community_id = $1
      `;
      
      const values = [communityId];
      let paramCount = 1;

      if (filters.status) {
        paramCount++;
        query += ` AND scr.status = $${paramCount}`;
        values.push(filters.status);
      }

      query += ` ORDER BY 
        CASE scr.status 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          ELSE 3 
        END, scr.requested_at DESC`;

      const result = await pool.query(query, values);
      return result.rows.map(row => new SubClubCommunityRequest(row));
    } catch (error) {
      throw new Error(`Failed to fetch community requests: ${error.message}`);
    }
  }

  // Get all requests by a user
  static async getByUser(userId, filters = {}) {
    try {
      let query = `
        SELECT scr.*, 
               sc.name as sub_club_name, sc.description as sub_club_description,
               c.name as community_name,
               u_req.username as requester_username,
               u_rev.username as reviewer_username
        FROM subclub_community_requests scr
        JOIN sub_clubs sc ON scr.sub_club_id = sc.id
        JOIN communities c ON scr.community_id = c.id
        JOIN users u_req ON scr.requested_by = u_req.id
        LEFT JOIN users u_rev ON scr.reviewed_by = u_rev.id
        WHERE scr.requested_by = $1
      `;
      
      const values = [userId];
      let paramCount = 1;

      if (filters.status) {
        paramCount++;
        query += ` AND scr.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.community_id) {
        paramCount++;
        query += ` AND scr.community_id = $${paramCount}`;
        values.push(filters.community_id);
      }

      query += ` ORDER BY scr.requested_at DESC`;

      const result = await pool.query(query, values);
      return result.rows.map(row => new SubClubCommunityRequest(row));
    } catch (error) {
      throw new Error(`Failed to fetch user requests: ${error.message}`);
    }
  }

  // Get request by ID
  static async getById(requestId) {
    try {
      const query = `
        SELECT scr.*, 
               sc.name as sub_club_name, sc.description as sub_club_description,
               sc.member_count, sc.tags as sub_club_tags, sc.rules as sub_club_rules,
               c.name as community_name, c.description as community_description,
               u_req.username as requester_username,
               u_rev.username as reviewer_username
        FROM subclub_community_requests scr
        JOIN sub_clubs sc ON scr.sub_club_id = sc.id
        JOIN communities c ON scr.community_id = c.id
        JOIN users u_req ON scr.requested_by = u_req.id
        LEFT JOIN users u_rev ON scr.reviewed_by = u_rev.id
        WHERE scr.id = $1
      `;

      const result = await pool.query(query, [requestId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new SubClubCommunityRequest(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch request: ${error.message}`);
    }
  }

  // Approve a request (community admin action)
  static async approve(requestId, reviewerId, reviewMessage = null, finalName = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get the request details
      const requestResult = await client.query(
        'SELECT * FROM subclub_community_requests WHERE id = $1 AND status = $2',
        [requestId, 'pending']
      );

      if (requestResult.rows.length === 0) {
        throw new Error('Request not found or already processed');
      }

      const request = requestResult.rows[0];

      // Verify reviewer has permission
      const permissionCheck = await client.query(`
        SELECT cm.role, mod.permissions 
        FROM community_memberships cm
        LEFT JOIN community_moderators mod ON cm.community_id = mod.community_id AND cm.user_id = mod.user_id
        WHERE cm.community_id = $1 AND cm.user_id = $2 
        AND (cm.role IN ('creator', 'admin') OR mod.permissions @> ARRAY['approve_subclubs'])
      `, [request.community_id, reviewerId]);

      if (permissionCheck.rows.length === 0) {
        throw new Error('Insufficient permissions to approve sub-club requests');
      }

      // Update the sub-club to join the community
      const subClubName = finalName || request.proposed_name || request.sub_club_name;
      
      await client.query(`
        UPDATE sub_clubs 
        SET community_id = $1, 
            name = $2,
            is_independent = false,
            seeking_community = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [request.community_id, subClubName, request.sub_club_id]);

      // Update the request status
      await client.query(`
        UPDATE subclub_community_requests 
        SET status = 'approved',
            reviewed_by = $1,
            reviewed_at = CURRENT_TIMESTAMP,
            review_message = $2
        WHERE id = $3
      `, [reviewerId, reviewMessage, requestId]);

      await client.query('COMMIT');

      // Return updated request
      return await this.getById(requestId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to approve request: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Reject a request (community admin action)
  static async reject(requestId, reviewerId, reviewMessage = null) {
    try {
      // Get the request details
      const requestResult = await pool.query(
        'SELECT community_id FROM subclub_community_requests WHERE id = $1 AND status = $2',
        [requestId, 'pending']
      );

      if (requestResult.rows.length === 0) {
        throw new Error('Request not found or already processed');
      }

      const request = requestResult.rows[0];

      // Verify reviewer has permission
      const permissionCheck = await pool.query(`
        SELECT cm.role, mod.permissions 
        FROM community_memberships cm
        LEFT JOIN community_moderators mod ON cm.community_id = mod.community_id AND cm.user_id = mod.user_id
        WHERE cm.community_id = $1 AND cm.user_id = $2 
        AND (cm.role IN ('creator', 'admin') OR mod.permissions @> ARRAY['approve_subclubs'])
      `, [request.community_id, reviewerId]);

      if (permissionCheck.rows.length === 0) {
        throw new Error('Insufficient permissions to reject sub-club requests');
      }

      // Update the request status
      await pool.query(`
        UPDATE subclub_community_requests 
        SET status = 'rejected',
            reviewed_by = $1,
            reviewed_at = CURRENT_TIMESTAMP,
            review_message = $2
        WHERE id = $3
      `, [reviewerId, reviewMessage, requestId]);

      // Return updated request
      return await this.getById(requestId);
    } catch (error) {
      throw new Error(`Failed to reject request: ${error.message}`);
    }
  }

  // Cancel a request (requester action)
  static async cancel(requestId, userId) {
    try {
      const result = await pool.query(`
        DELETE FROM subclub_community_requests 
        WHERE id = $1 AND requested_by = $2 AND status = 'pending'
        RETURNING *
      `, [requestId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Request not found, already processed, or you do not have permission to cancel it');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to cancel request: ${error.message}`);
    }
  }

  // Get pending requests count for a community
  static async getPendingCount(communityId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM subclub_community_requests WHERE community_id = $1 AND status = $2',
        [communityId, 'pending']
      );
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to get pending requests count: ${error.message}`);
    }
  }
}

module.exports = SubClubCommunityRequest; 