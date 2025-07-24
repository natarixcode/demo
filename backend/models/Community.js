const { pool } = require('../db');

class Community {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.visibility = data.visibility || 'public';
    this.type = data.type || 'agnostic';
    this.location = data.location;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.radius_km = data.radius_km || 5; // Default 5km radius
    this.pin_code = data.pin_code;
    this.creator_id = data.creator_id;
    this.tags = data.tags || [];
    this.member_count = data.member_count || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // User-specific fields (only available when queried with userId)
    this.user_role = data.user_role || null;
    this.user_status = data.user_status || null;
    this.join_request_status = data.join_request_status || null;
    
    // Additional fields from joins
    this.creator_name = data.creator_name;
    this.actual_member_count = data.actual_member_count || this.member_count;
  }

  // Create a new community
  static async create(communityData) {
    const {
      name,
      description,
      visibility = 'public',
      type = 'agnostic',
      location,
      latitude,
      longitude,
      creator_id,
      tags = []
    } = communityData;

    try {
      const query = `
        INSERT INTO communities (name, description, visibility, type, location, latitude, longitude, creator_id, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [name, description, visibility, type, location, latitude, longitude, creator_id, tags];
      const result = await pool.query(query, values);
      
      return new Community(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create community: ${error.message}`);
    }
  }

  // Get all communities with optional filters
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT c.*, u.username as creator_name,
               COUNT(cm.id) as actual_member_count
        FROM communities c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN community_memberships cm ON c.id = cm.community_id AND cm.status = 'active'
      `;
      
      const conditions = [];
      const values = [];
      let paramCount = 0;

      // Apply filters
      if (filters.type) {
        paramCount++;
        conditions.push(`c.type = $${paramCount}`);
        values.push(filters.type);
      }

      if (filters.visibility) {
        paramCount++;
        conditions.push(`c.visibility = $${paramCount}`);
        values.push(filters.visibility);
      }

      if (filters.location) {
        paramCount++;
        conditions.push(`c.location ILIKE $${paramCount}`);
        values.push(`%${filters.location}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        paramCount++;
        conditions.push(`c.tags && $${paramCount}`);
        values.push(filters.tags);
      }

      if (filters.search) {
        paramCount++;
        conditions.push(`(c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`);
        values.push(`%${filters.search}%`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += `
        GROUP BY c.id, u.username
        ORDER BY c.created_at DESC
        LIMIT ${filters.limit || 50}
        OFFSET ${filters.offset || 0}
      `;

      const result = await pool.query(query, values);
      return result.rows.map(row => new Community(row));
    } catch (error) {
      throw new Error(`Failed to fetch communities: ${error.message}`);
    }
  }

  // Get community by ID with detailed information
  static async getById(id, userId = null) {
    try {
      console.log(`🔍 Community.getById called with id: ${id}, userId: ${userId}`);
      
      const query = `
        SELECT c.*, u.username as creator_name,
               COUNT(cm.id) as actual_member_count,
               ${userId ? `
               CASE WHEN cm_user.id IS NOT NULL THEN cm_user.role ELSE NULL END as user_role,
               CASE WHEN cm_user.id IS NOT NULL THEN cm_user.status ELSE NULL END as user_status,
               CASE WHEN jr.id IS NOT NULL THEN jr.status ELSE NULL END as join_request_status
               ` : 'NULL as user_role, NULL as user_status, NULL as join_request_status'}
        FROM communities c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN community_memberships cm ON c.id = cm.community_id AND cm.status = 'active'
        ${userId ? `
        LEFT JOIN community_memberships cm_user ON c.id = cm_user.community_id AND cm_user.user_id = $2 AND cm_user.status = 'active'
        LEFT JOIN join_requests jr ON c.id = jr.community_id AND jr.user_id = $2 AND jr.status = 'pending'
        ` : ''}
        WHERE c.id = $1
        GROUP BY c.id, u.username${userId ? ', cm_user.id, cm_user.role, cm_user.status, jr.id, jr.status' : ''}
      `;

      const values = userId ? [id, userId] : [id];
      console.log('🔍 Community.getById query:', query);
      console.log('🔍 Community.getById values:', values);
      
      const result = await pool.query(query, values);
      console.log('🔍 Community.getById raw result:', result.rows[0]);
      
      if (result.rows.length === 0) {
        console.log('❌ Community not found');
        return null;
      }

      // Also check membership directly for debugging
      if (userId) {
        const membershipCheck = await pool.query(
          'SELECT * FROM community_memberships WHERE community_id = $1 AND user_id = $2',
          [id, userId]
        );
        console.log('🔍 Direct membership check:', membershipCheck.rows);
      }

      const community = new Community(result.rows[0]);
      console.log('✅ Community object created:', {
        id: community.id,
        name: community.name,
        user_role: community.user_role,
        user_status: community.user_status
      });
      
      return community;
    } catch (error) {
      console.error('❌ Error in Community.getById:', error);
      throw new Error(`Failed to fetch community: ${error.message}`);
    }
  }

  // Update community
  static async update(id, updateData, userId) {
    try {
      // Check if user has permission to update
      const permissionCheck = await pool.query(
        'SELECT role FROM community_memberships WHERE community_id = $1 AND user_id = $2 AND role IN ($3, $4)',
        [id, userId, 'creator', 'moderator']
      );

      if (permissionCheck.rows.length === 0) {
        throw new Error('Insufficient permissions to update community');
      }

      const allowedFields = ['name', 'description', 'visibility', 'type', 'location', 'latitude', 'longitude', 'tags'];
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
        UPDATE communities 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return new Community(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update community: ${error.message}`);
    }
  }

  // Delete community
  static async delete(id, userId) {
    try {
      // Check if user is the creator
      const permissionCheck = await pool.query(
        'SELECT role FROM community_memberships WHERE community_id = $1 AND user_id = $2 AND role = $3',
        [id, userId, 'creator']
      );

      if (permissionCheck.rows.length === 0) {
        throw new Error('Only the creator can delete a community');
      }

      const result = await pool.query('DELETE FROM communities WHERE id = $1 RETURNING *', [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to delete community: ${error.message}`);
    }
  }

  // Get community members
  static async getMembers(communityId, filters = {}) {
    try {
      let query = `
        SELECT cm.*, u.username, u.email, u.created_at as user_created_at
        FROM community_memberships cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.community_id = $1
      `;
      
      const values = [communityId];
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
      throw new Error(`Failed to fetch community members: ${error.message}`);
    }
  }

  // Get communities by user
  static async getByUser(userId, filters = {}) {
    try {
      let query = `
        SELECT c.*, cm.role, cm.status, cm.joined_at as user_joined_at
        FROM communities c
        JOIN community_memberships cm ON c.id = cm.community_id
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

      query += ` ORDER BY cm.joined_at DESC`;

      const result = await pool.query(query, values);
      return result.rows.map(row => new Community(row));
    } catch (error) {
      throw new Error(`Failed to fetch user communities: ${error.message}`);
    }
  }

  // Search communities
  static async search(searchTerm, filters = {}) {
    const searchFilters = {
      ...filters,
      search: searchTerm
    };
    return await this.getAll(searchFilters);
  }

  // Calculate distance between two points using Haversine formula
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  // Check if user is within community radius
  static isUserInRadius(userLat, userLon, communityLat, communityLon, radiusKm) {
    if (!userLat || !userLon || !communityLat || !communityLon) {
      return false;
    }
    const distance = this.calculateDistance(userLat, userLon, communityLat, communityLon);
    return distance <= radiusKm;
  }

  // Get nearby communities for a user location
  static async getNearby(userLat, userLon, maxDistance = 50) {
    try {
      const query = `
        SELECT *,
        (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * 
         cos(radians(longitude) - radians($2)) + sin(radians($1)) * 
         sin(radians(latitude)))) AS distance
        FROM communities 
        WHERE type = 'location_bound' 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        HAVING distance <= $3
        ORDER BY distance
      `;
      
      const result = await pool.query(query, [userLat, userLon, maxDistance]);
      return result.rows.map(row => new Community(row));
    } catch (error) {
      throw new Error(`Failed to get nearby communities: ${error.message}`);
    }
  }

  // Check if user can access a location-bound community
  static async checkLocationAccess(communityId, userLat, userLon) {
    try {
      const community = await this.getById(communityId); // Fixed: was findById, should be getById
      if (!community) {
        return { canAccess: false, reason: 'Community not found' };
      }

      // If community is not location-bound, allow access
      if (community.type !== 'location_bound') {
        return { canAccess: true };
      }

      // Check if user location is provided
      if (!userLat || !userLon) {
        return { 
          canAccess: false, 
          reason: 'Location required for this community',
          requiresLocation: true 
        };
      }

      // Check if user is within radius
      const isInRadius = this.isUserInRadius(
        userLat, userLon, 
        community.latitude, community.longitude, 
        community.radius_km
      );

      if (isInRadius) {
        return { canAccess: true };
      } else {
        const distance = this.calculateDistance(
          userLat, userLon, 
          community.latitude, community.longitude
        );
        return { 
          canAccess: false, 
          reason: `You are ${distance.toFixed(1)}km away from this community's ${community.radius_km}km radius`,
          distance: distance,
          requiredRadius: community.radius_km
        };
      }
    } catch (error) {
      throw new Error(`Failed to check location access: ${error.message}`);
    }
  }

  // Update community radius (only for creator)
  static async updateRadius(communityId, newRadius, userId) {
    try {
      const query = `
        UPDATE communities 
        SET radius_km = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND creator_id = $3
        RETURNING *
      `;
      
      const result = await pool.query(query, [newRadius, communityId, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Community not found or you are not the creator');
      }
      
      return new Community(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update radius: ${error.message}`);
    }
  }
}

module.exports = Community;
