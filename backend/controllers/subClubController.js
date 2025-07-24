const SubClub = require('../models/SubClub');
const Membership = require('../models/Membership');

class SubClubController {
  // Get all sub-clubs with filters
  static async getAllSubClubs(req, res) {
    try {
      const filters = {
        type: req.query.type,
        visibility: req.query.visibility,
        location: req.query.location,
        community_id: req.query.community_id,
        search: req.query.search,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const subClubs = await SubClub.getAll(filters);

      res.json({
        success: true,
        data: subClubs,
        count: subClubs.length,
        filters: filters
      });
    } catch (error) {
      console.error('Error fetching sub-clubs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sub-clubs',
        details: error.message
      });
    }
  }

  // Get sub-clubs by community
  static async getSubClubsByCommunity(req, res) {
    try {
      const { communityId } = req.params;
      const userId = req.user?.id;

      const subClubs = await SubClub.getByCommunity(communityId, userId);

      res.json({
        success: true,
        data: subClubs,
        count: subClubs.length
      });
    } catch (error) {
      console.error('Error fetching sub-clubs by community:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sub-clubs',
        details: error.message
      });
    }
  }

  // Get sub-club by ID
  static async getSubClubById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const subClub = await SubClub.getById(id, userId);

      if (!subClub) {
        return res.status(404).json({
          success: false,
          error: 'Sub-club not found'
        });
      }

      res.json({
        success: true,
        data: subClub
      });
    } catch (error) {
      console.error('Error fetching sub-club:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sub-club',
        details: error.message
      });
    }
  }

  // Create new sub-club
  static async createSubClub(req, res) {
    try {
      const {
        name,
        description,
        community_id,
        visibility = 'public',
        type = 'agnostic',
        location,
        latitude,
        longitude
      } = req.body;

      const userId = req.user.id;

      // Validation
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Sub-club name is required'
        });
      }

      if (!community_id) {
        return res.status(400).json({
          success: false,
          error: 'Community ID is required'
        });
      }

      if (name.length > 255) {
        return res.status(400).json({
          success: false,
          error: 'Sub-club name must be less than 255 characters'
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
          error: 'Location is required for location-bound sub-clubs'
        });
      }

      const subClubData = {
        name: name.trim(),
        description: description?.trim(),
        community_id: parseInt(community_id),
        visibility,
        type,
        location: location?.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        creator_id: userId
      };

      const subClub = await SubClub.create(subClubData);

      res.status(201).json({
        success: true,
        data: subClub,
        message: 'Sub-club created successfully'
      });
    } catch (error) {
      console.error('Error creating sub-club:', error);
      
      // Handle unique constraint violation
      if (error.message.includes('duplicate key value violates unique constraint')) {
        return res.status(409).json({
          success: false,
          error: 'A sub-club with this name already exists in this community'
        });
      }

      if (error.message.includes('must be a member of the community')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create sub-club',
        details: error.message
      });
    }
  }

  // Create independent sub-club
  static async createIndependentSubClub(req, res) {
    try {
      const {
        name,
        description,
        visibility = 'public',
        type = 'agnostic',
        location,
        latitude,
        longitude,
        seeking_community = false,
        tags = [],
        rules = []
      } = req.body;

      const userId = req.user.id;

      // Validation
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Sub-club name is required'
        });
      }

      if (name.length > 255) {
        return res.status(400).json({
          success: false,
          error: 'Sub-club name must be less than 255 characters'
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
          error: 'Location is required for location-bound sub-clubs'
        });
      }

      const subClubData = {
        name: name.trim(),
        description: description?.trim(),
        visibility,
        type,
        location: location?.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        creator_id: userId,
        seeking_community: seeking_community === true,
        tags: Array.isArray(tags) ? tags : [],
        rules: Array.isArray(rules) ? rules : []
      };

      const subClub = await SubClub.createIndependent(subClubData);

      res.status(201).json({
        success: true,
        data: subClub,
        message: 'Independent sub-club created successfully'
      });
    } catch (error) {
      console.error('Error creating independent sub-club:', error);
      
      // Handle unique constraint violation (though less likely for independent sub-clubs)
      if (error.message.includes('duplicate key value violates unique constraint')) {
        return res.status(409).json({
          success: false,
          error: 'A sub-club with this name already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create independent sub-club',
        details: error.message
      });
    }
  }

  // Update sub-club
  static async updateSubClub(req, res) {
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
          error: 'Sub-club name must be less than 255 characters'
        });
      }

      const subClub = await SubClub.update(id, updateData, userId);

      res.json({
        success: true,
        data: subClub,
        message: 'Sub-club updated successfully'
      });
    } catch (error) {
      console.error('Error updating sub-club:', error);
      
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('duplicate key value violates unique constraint')) {
        return res.status(409).json({
          success: false,
          error: 'A sub-club with this name already exists in this community'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update sub-club',
        details: error.message
      });
    }
  }

  // Delete sub-club
  static async deleteSubClub(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const success = await SubClub.delete(id, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Sub-club deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Sub-club not found'
        });
      }
    } catch (error) {
      console.error('Error deleting sub-club:', error);
      
      if (error.message.includes('Only the creator can delete')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete sub-club',
        details: error.message
      });
    }
  }

  // Get sub-club members
  static async getSubClubMembers(req, res) {
    try {
      const { id } = req.params;
      const filters = {
        role: req.query.role,
        status: req.query.status || 'active'
      };

      const members = await SubClub.getMembers(id, filters);

      res.json({
        success: true,
        data: members,
        count: members.length
      });
    } catch (error) {
      console.error('Error fetching sub-club members:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sub-club members',
        details: error.message
      });
    }
  }

  // Join sub-club
  static async joinSubClub(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { message } = req.body;

      const result = await Membership.joinSubClub(userId, id, message);

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
          message: 'Successfully joined sub-club'
        });
      }
    } catch (error) {
      console.error('Error joining sub-club:', error);
      
      if (error.message.includes('already a member') || error.message.includes('already pending')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('not found') || error.message.includes('must be a member of the parent community')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to join sub-club',
        details: error.message
      });
    }
  }

  // Leave sub-club
  static async leaveSubClub(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const success = await Membership.leaveSubClub(userId, id);

      if (success) {
        res.json({
          success: true,
          message: 'Successfully left sub-club'
        });
      }
    } catch (error) {
      console.error('Error leaving sub-club:', error);
      
      if (error.message.includes('not a member') || error.message.includes('cannot leave')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to leave sub-club',
        details: error.message
      });
    }
  }

  // Get user's sub-clubs
  static async getUserSubClubs(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        role: req.query.role,
        status: req.query.status || 'active',
        community_id: req.query.community_id
      };

      const subClubs = await SubClub.getByUser(userId, filters);

      res.json({
        success: true,
        data: subClubs,
        count: subClubs.length
      });
    } catch (error) {
      console.error('Error fetching user sub-clubs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user sub-clubs',
        details: error.message
      });
    }
  }

  // Get join requests for a sub-club
  static async getSubClubJoinRequests(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const requests = await Membership.getPendingRequests(id, 'sub_club', userId);

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
}

module.exports = SubClubController; 