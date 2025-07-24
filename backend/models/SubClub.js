const { pool } = require('../db');

class SubClub {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.community_id = data.community_id;
    this.visibility = data.visibility || 'public';
    this.type = data.type || 'agnostic';
    this.location = data.location;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.creator_id = data.creator_id;
    this.member_count = data.member_count || 0;
    this.is_independent = data.is_independent || false;
    this.seeking_community = data.seeking_community || false;
    this.tags = data.tags || [];
    this.rules = data.rules || [];
    this.banner_url = data.banner_url;
    this.icon_url = data.icon_url;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // User-specific fields (only available when queried with userId)
    this.user_role = data.user_role || null;
    this.user_status = data.user_status || null;
    this.join_request_status = data.join_request_status || null;
    
    // Additional fields from joins
    this.creator_name = data.creator_name;
    this.community_name = data.community_name;
    this.actual_member_count = data.actual_member_count || this.member_count;
  }

  // Create a new sub-club
  static async create(subClubData) {
    const {
      name,
      description,
      community_id,
      visibility = 'public',
      type = 'agnostic',
      location,
      latitude,
      longitude,
      creator_id
    } = subClubData;

    try {
      // Check if user is a member of the parent community
      const membershipCheck = await pool.query(
        'SELECT role FROM community_memberships WHERE community_id = $1 AND user_id = $2 AND status = $3',
        [community_id, creator_id, 'active']
      );

      if (membershipCheck.rows.length === 0) {
        throw new Error('You must be a member of the community to create a sub-club');
      }

      const query = `
        INSERT INTO sub_clubs (name, description, community_id, visibility, type, location, latitude, longitude, creator_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [name, description, community_id, visibility, type, location, latitude, longitude, creator_id];
      const result = await pool.query(query, values);
      
      return new SubClub(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create sub-club: ${error.message}`);
    }
  }

  // Create an independent sub-club (not tied to any community initially)
  static async createIndependent(subClubData) {
    const {
      name,
      description,
      visibility = 'public',
      type = 'agnostic',
      location,
      latitude,
      longitude,
      creator_id,
      seeking_community = false,
      tags = [],
      rules = []
    } = subClubData;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create the independent sub-club
      const query = `
        INSERT INTO sub_clubs (
          name, description, community_id, visibility, type, location, 
          latitude, longitude, creator_id, is_independent, seeking_community, tags, rules
        )
        VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, true, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        name, description, visibility, type, location, 
        latitude, longitude, creator_id, seeking_community, tags, rules
      ];
      const result = await client.query(query, values);
      const subClub = result.rows[0];

      // Auto-join the creator as the creator/admin of the sub-club
      await client.query(
        'INSERT INTO community_memberships (user_id, sub_club_id, role, status) VALUES ($1, $2, $3, $4)',
        [creator_id, subClub.id, 'creator', 'active']
      );

      await client.query('COMMIT');
      return new SubClub(subClub);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create independent sub-club: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Get all sub-clubs for a community
  static async getByCommunity(communityId, userId = null) {
    try {
      const query = `
        SELECT sc.*, u.username as creator_name,
               COUNT(cm.id) as actual_member_count,
               ${userId ? `
               CASE WHEN cm_user.id IS NOT NULL THEN cm_user.role ELSE NULL END as user_role,
               CASE WHEN cm_user.id IS NOT NULL THEN cm_user.status ELSE NULL END as user_status,
               CASE WHEN jr.id IS NOT NULL THEN jr.status ELSE NULL END as join_request_status
               ` : 'NULL as user_role, NULL as user_status, NULL as join_request_status'}
        FROM sub_clubs sc
        LEFT JOIN users u ON sc.creator_id = u.id
        LEFT JOIN community_memberships cm ON sc.id = cm.sub_club_id AND cm.status = 'active'
        ${userId ? `
        LEFT JOIN community_memberships cm_user ON sc.id = cm_user.sub_club_id AND cm_user.user_id = $2
        LEFT JOIN join_requests jr ON sc.id = jr.sub_club_id AND jr.user_id = $2 AND jr.status = 'pending'
        ` : ''}
        WHERE sc.community_id = $1
        GROUP BY sc.id, u.username${userId ? ', cm_user.id, cm_user.role, cm_user.status, jr.id, jr.status' : ''}
        ORDER BY sc.created_at DESC
      `;

      const values = userId ? [communityId, userId] : [communityId];
      const result = await pool.query(query, values);
      
      return result.rows.map(row => new SubClub(row));
    } catch (error) {
      throw new Error(`Failed to fetch sub-clubs: ${error.message}`);
    }
  }

  // Get sub-club by ID with detailed information
  static async getById(id, userId = null) {
    try {
      const query = `
        SELECT sc.*, u.username as creator_name, c.name as community_name,
               COUNT(cm.id) as actual_member_count,
               ${userId ? `
               CASE WHEN cm_user.id IS NOT NULL THEN cm_user.role ELSE NULL END as user_role,
               CASE WHEN cm_user.id IS NOT NULL THEN cm_user.status ELSE NULL END as user_status,
               CASE WHEN jr.id IS NOT NULL THEN jr.status ELSE NULL END as join_request_status
               ` : 'NULL as user_role, NULL as user_status, NULL as join_request_status'}
        FROM sub_clubs sc
        LEFT JOIN users u ON sc.creator_id = u.id
        LEFT JOIN communities c ON sc.community_id = c.id
        LEFT JOIN community_memberships cm ON sc.id = cm.sub_club_id AND cm.status = 'active'
        ${userId ? `
        LEFT JOIN community_memberships cm_user ON sc.id = cm_user.sub_club_id AND cm_user.user_id = $2
        LEFT JOIN join_requests jr ON sc.id = jr.sub_club_id AND jr.user_id = $2 AND jr.status = 'pending'
        ` : ''}
        WHERE sc.id = $1
        GROUP BY sc.id, u.username, c.name${userId ? ', cm_user.id, cm_user.role, cm_user.status, jr.id, jr.status' : ''}
      `;

      const values = userId ? [id, userId] : [id];
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new SubClub(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch sub-club: ${error.message}`);
    }
  }

  // Update sub-club
  static async update(id, updateData, userId) {
    try {
      // Check if user has permission to update
      const permissionCheck = await pool.query(
        'SELECT role FROM community_memberships WHERE sub_club_id = $1 AND user_id = $2 AND role IN ($3, $4)',
        [id, userId, 'creator', 'moderator']
      );

      if (permissionCheck.rows.length === 0) {
        throw new Error('Insufficient permissions to update sub-club');
      }

      const allowedFields = ['name', 'description', 'visibility', 'type', 'location', 'latitude', 'longitude'];
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      values.push(id);

      const query = `
        UPDATE sub_clubs 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return new SubClub(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update sub-club: ${error.message}`);
    }
  }

  // Delete sub-club
  static async delete(id, userId) {
    try {
      // Check if user is the creator
      const permissionCheck = await pool.query(
        'SELECT role FROM community_memberships WHERE sub_club_id = $1 AND user_id = $2 AND role = $3',
        [id, userId, 'creator']
      );

      if (permissionCheck.rows.length === 0) {
        throw new Error('Only the creator can delete a sub-club');
      }

      const result = await pool.query('DELETE FROM sub_clubs WHERE id = $1 RETURNING *', [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to delete sub-club: ${error.message}`);
    }
  }

  // Get sub-club members
  static async getMembers(subClubId, filters = {}) {
    try {
      let query = `
        SELECT cm.*, u.username, u.email, u.created_at as user_created_at
        FROM community_memberships cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.sub_club_id = $1
      `;
      
      const values = [subClubId];
      let paramCount = 1;

      if (filters.role) {
        paramCount++;
        query += ` AND cm.role = $${paramCount}`;
        values.push(filters.role);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND cm.status = $${paramCount}`;
        values.push(filters.status);
      }

      query += ` ORDER BY 
        CASE cm.role 
          WHEN 'creator' THEN 1 
          WHEN 'moderator' THEN 2 
          ELSE 3 
        END, cm.joined_at ASC`;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch sub-club members: ${error.message}`);
    }
  }

  // Get sub-clubs by user
  static async getByUser(userId, filters = {}) {
    try {
      let query = `
        SELECT sc.*, cm.role, cm.status, cm.joined_at as user_joined_at, c.name as community_name
        FROM sub_clubs sc
        JOIN community_memberships cm ON sc.id = cm.sub_club_id
        JOIN communities c ON sc.community_id = c.id
        WHERE cm.user_id = $1
      `;
      
      const values = [userId];
      let paramCount = 1;

      if (filters.role) {
        paramCount++;
        query += ` AND cm.role = $${paramCount}`;
        values.push(filters.role);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND cm.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.community_id) {
        paramCount++;
        query += ` AND sc.community_id = $${paramCount}`;
        values.push(filters.community_id);
      }

      query += ` ORDER BY cm.joined_at DESC`;

      const result = await pool.query(query, values);
      return result.rows.map(row => new SubClub(row));
    } catch (error) {
      throw new Error(`Failed to fetch user sub-clubs: ${error.message}`);
    }
  }

  // Get all sub-clubs with filters
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT sc.*, u.username as creator_name, c.name as community_name,
               COUNT(cm.id) as actual_member_count
        FROM sub_clubs sc
        LEFT JOIN users u ON sc.creator_id = u.id
        LEFT JOIN communities c ON sc.community_id = c.id
        LEFT JOIN community_memberships cm ON sc.id = cm.sub_club_id AND cm.status = 'active'
      `;
      
      const conditions = [];
      const values = [];
      let paramCount = 0;

      // Apply filters
      if (filters.type) {
        paramCount++;
        conditions.push(`sc.type = $${paramCount}`);
        values.push(filters.type);
      }

      if (filters.visibility) {
        paramCount++;
        conditions.push(`sc.visibility = $${paramCount}`);
        values.push(filters.visibility);
      }

      if (filters.location) {
        paramCount++;
        conditions.push(`sc.location ILIKE $${paramCount}`);
        values.push(`%${filters.location}%`);
      }

      if (filters.community_id) {
        paramCount++;
        conditions.push(`sc.community_id = $${paramCount}`);
        values.push(filters.community_id);
      }

      if (filters.search) {
        paramCount++;
        conditions.push(`(sc.name ILIKE $${paramCount} OR sc.description ILIKE $${paramCount})`);
        values.push(`%${filters.search}%`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += `
        GROUP BY sc.id, u.username, c.name
        ORDER BY sc.created_at DESC
        LIMIT ${filters.limit || 50}
        OFFSET ${filters.offset || 0}
      `;

      const result = await pool.query(query, values);
      return result.rows.map(row => new SubClub(row));
    } catch (error) {
      throw new Error(`Failed to fetch sub-clubs: ${error.message}`);
    }
  }
}

module.exports = SubClub; 