const Community = require('../models/Community');
const SubClub = require('../models/SubClub');
const Membership = require('../models/Membership');

class CommunityController {
  // Get all communities with filters
  static async getAllCommunities(req, res) {
    try {
      const filters = {
        type: req.query.type,
        visibility: req.query.visibility,
        location: req.query.location,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
        search: req.query.search,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const communities = await Community.getAll(filters);

      res.json({
        success: true,
        data: communities,
        count: communities.length,
        filters: filters
      });
    } catch (error) {
      console.error('Error fetching communities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch communities',
        details: error.message
      });
    }
  }

  // Get community by ID
  static async getCommunityById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      console.log(`Getting community ${id} for user ${userId}`);
      console.log('Full user object:', req.user);

      const community = await Community.getById(id, userId);

      if (!community) {
        return res.status(404).json({
          success: false,
          error: 'Community not found'
        });
      }

      // Get sub-clubs for this community
      const subClubs = await SubClub.getByCommunity(id, userId);

      res.json({
        success: true,
        data: {
          ...community,
          sub_clubs: subClubs
        }
      });
    } catch (error) {
      console.error('Error fetching community:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch community',
        details: error.message
      });
    }
  }

  // Debug: Check user's memberships
  static async checkUserMemberships(req, res) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      console.log('Checking memberships for user:', userId, 'in community:', id);

      // Check community memberships
      const { pool } = require('../db');
      const result = await pool.query(
        'SELECT * FROM community_memberships WHERE user_id = $1 AND community_id = $2',
        [userId, id]
      );

      console.log('Membership result:', result.rows);

      res.json({
        success: true,
        data: {
          userId,
          communityId: id,
          memberships: result.rows
        }
      });
    } catch (error) {
      console.error('Error checking memberships:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check memberships',
        details: error.message
      });
    }
  }

  // Create new community
  static async createCommunity(req, res) {
    try {
      const {
        name,
        description,
        visibility = 'public',
        type = 'agnostic',
        location,
        latitude,
        longitude,
        tags = []
      } = req.body;

      const userId = req.user.id;

      // Validation
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Community name is required'
        });
      }

      if (name.length > 255) {
        return res.status(400).json({
          success: false,
          error: 'Community name must be less than 255 characters'
        });
      }

      if (!['public', 'private'].includes(visibility)) {
        return res.status(400).json({
          success: false,
          error: 'Visibility must be either "public" or "private"'
        });
      }

      if (!['location_bound', 'agnostic'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be either "location_bound" or "agnostic"'
        });
      }

      // If location-bound, location is required
      if (type === 'location_bound' && !location) {
        return res.status(400).json({
          success: false,
          error: 'Location is required for location-bound communities'
        });
      }

      const communityData = {
        name: name.trim(),
        description: description?.trim(),
        visibility,
        type,
        location: location?.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        creator_id: userId,
        tags: Array.isArray(tags) ? tags : []
      };

      const community = await Community.create(communityData);

      res.status(201).json({
        success: true,
        data: community,
        message: 'Community created successfully'
      });
    } catch (error) {
      console.error('Error creating community:', error);
      
      // Handle unique constraint violation
      if (error.message.includes('duplicate key value violates unique constraint')) {
        return res.status(409).json({
          success: false,
          error: 'A community with this name already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create community',
        details: error.message
      });
    }
  }

  // Update community
  static async updateCommunity(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Validation for specific fields
      if (updateData.visibility && !['public', 'private'].includes(updateData.visibility)) {
        return res.status(400).json({
          success: false,
          error: 'Visibility must be either "public" or "private"'
        });
      }

      if (updateData.type && !['location_bound', 'agnostic'].includes(updateData.type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be either "location_bound" or "agnostic"'
        });
      }

      if (updateData.name && updateData.name.length > 255) {
        return res.status(400).json({
          success: false,
          error: 'Community name must be less than 255 characters'
        });
      }

      const community = await Community.update(id, updateData, userId);

      res.json({
        success: true,
        data: community,
        message: 'Community updated successfully'
      });
    } catch (error) {
      console.error('Error updating community:', error);
      
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('duplicate key value violates unique constraint')) {
        return res.status(409).json({
          success: false,
          error: 'A community with this name already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update community',
        details: error.message
      });
    }
  }

  // Delete community
  static async deleteCommunity(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const success = await Community.delete(id, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Community deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Community not found'
        });
      }
    } catch (error) {
      console.error('Error deleting community:', error);
      
      if (error.message.includes('Only the creator can delete')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete community',
        details: error.message
      });
    }
  }

  // Get community members
  static async getCommunityMembers(req, res) {
    try {
      const { id } = req.params;
      const filters = {
        role: req.query.role,
        status: req.query.status || 'active'
      };

      const members = await Community.getMembers(id, filters);

      res.json({
        success: true,
        data: members,
        count: members.length
      });
    } catch (error) {
      console.error('Error fetching community members:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch community members',
        details: error.message
      });
    }
  }

  // Join community
  static async joinCommunity(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { message } = req.body;

      const result = await Membership.joinCommunity(userId, id, message);

      if (result.type === 'join_request') {
        res.status(202).json({
          success: true,
          data: result.data,
          message: 'Join request submitted successfully. Waiting for approval.'
        });
      } else {
        res.json({
          success: true,
          data: result,
          message: 'Successfully joined community'
        });
      }
    } catch (error) {
      console.error('Error joining community:', error);
      
      if (error.message.includes('already a member') || error.message.includes('already pending')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to join community',
        details: error.message
      });
    }
  }

  // Leave community
  static async leaveCommunity(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const success = await Membership.leaveCommunity(userId, id);

      if (success) {
        res.json({
          success: true,
          message: 'Successfully left community'
        });
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      
      if (error.message.includes('not a member') || error.message.includes('cannot leave')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to leave community',
        details: error.message
      });
    }
  }

  // Get user's communities
  static async getUserCommunities(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        role: req.query.role,
        status: req.query.status || 'active'
      };

      const communities = await Community.getByUser(userId, filters);

      res.json({
        success: true,
        data: communities,
        count: communities.length
      });
    } catch (error) {
      console.error('Error fetching user communities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user communities',
        details: error.message
      });
    }
  }

  // Search communities
  static async searchCommunities(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm || searchTerm.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search term is required'
        });
      }

      const filters = {
        type: req.query.type,
        visibility: req.query.visibility,
        location: req.query.location,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const communities = await Community.search(searchTerm.trim(), filters);

      res.json({
        success: true,
        data: communities,
        count: communities.length,
        searchTerm: searchTerm.trim()
      });
    } catch (error) {
      console.error('Error searching communities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search communities',
        details: error.message
      });
    }
  }

  // Get join requests for a community
  static async getCommunityJoinRequests(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const requests = await Membership.getPendingRequests(id, 'community', userId);

      res.json({
        success: true,
        data: requests,
        count: requests.length
      });
    } catch (error) {
      console.error('Error fetching join requests:', error);
      
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch join requests',
        details: error.message
      });
    }
  }

  // Handle join request (approve/reject)
  static async handleJoinRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { action } = req.body; // 'approved' or 'rejected'
      const reviewerId = req.user.id;

      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Action must be either "approved" or "rejected"'
        });
      }

      const result = await Membership.handleJoinRequest(requestId, action, reviewerId);

      res.json({
        success: true,
        data: result,
        message: `Join request ${action} successfully`
      });
    } catch (error) {
      console.error('Error handling join request:', error);
      
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to handle join request',
        details: error.message
      });
    }
  }

  // Update member role
  static async updateMemberRole(req, res) {
    try {
      const { membershipId } = req.params;
      const { role } = req.body;
      const updaterId = req.user.id;

      if (!['member', 'moderator'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Role must be either "member" or "moderator"'
        });
      }

      const membership = await Membership.updateMemberRole(membershipId, role, updaterId);

      res.json({
        success: true,
        data: membership,
        message: 'Member role updated successfully'
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      
      if (error.message.includes('Only creators can update')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update member role',
        details: error.message
      });
    }
  }

  // Remove member
  static async removeMember(req, res) {
    try {
      const { membershipId } = req.params;
      const removerId = req.user.id;

      const success = await Membership.removeMember(membershipId, removerId);

      if (success) {
        res.json({
          success: true,
          message: 'Member removed successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Member not found or already removed'
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      
      if (error.message.includes('Insufficient permissions') || error.message.includes('Cannot remove creator')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to remove member',
        details: error.message
      });
    }
  }

  // Get nearby communities based on user location
  static async getNearby(req, res) {
    try {
      const { lat, lng, radius = 50 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = Math.min(parseInt(radius), 100); // Cap at 100km

      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid latitude or longitude'
        });
      }

      const communities = await Community.getNearby(userLat, userLng, maxRadius);

      res.json({
        success: true,
        data: communities,
        count: communities.length,
        userLocation: { lat: userLat, lng: userLng },
        searchRadius: maxRadius
      });
    } catch (error) {
      console.error('Error getting nearby communities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get nearby communities'
      });
    }
  }

  // Check if user can access a location-bound community
  static async checkLocationAccess(req, res) {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body;

      const result = await Community.checkLocationAccess(id, lat, lng);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error checking location access:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check location access'
      });
    }
  }

  // Update community radius (creator only)
  static async updateRadius(req, res) {
    try {
      const { id } = req.params;
      const { radius } = req.body;
      const userId = req.user.id;

      if (!radius || radius < 1 || radius > 100) {
        return res.status(400).json({
          success: false,
          error: 'Radius must be between 1 and 100 kilometers'
        });
      }

      const updatedCommunity = await Community.updateRadius(id, radius, userId);

      res.json({
        success: true,
        data: updatedCommunity,
        message: `Community radius updated to ${radius}km`
      });
    } catch (error) {
      console.error('Error updating radius:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update radius'
      });
    }
  }
}

module.exports = CommunityController; 