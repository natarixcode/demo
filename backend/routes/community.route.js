// backend/routes/community.route.js
const express = require('express');
const router = express.Router();
const CommunityController = require('../controllers/communityController');
const SubClubController = require('../controllers/subClubController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Community Routes

// GET /api/communities - Get all communities with filters
router.get('/communities', optionalAuth, CommunityController.getAllCommunities);

// GET /api/communities/search - Search communities
router.get('/communities/search', optionalAuth, CommunityController.searchCommunities);

// GET /api/communities/my - Get user's communities (requires auth)
router.get('/communities/my', authenticateToken, CommunityController.getUserCommunities);

// GET /api/communities/nearby - Get nearby communities based on user location
router.get('/communities/nearby', optionalAuth, CommunityController.getNearby);

// POST /api/communities/:id/check-access - Check if user can access location-bound community
router.post('/communities/:id/check-access', optionalAuth, CommunityController.checkLocationAccess);

// PUT /api/communities/:id/radius - Update community radius (creator only)
router.put('/communities/:id/radius', authenticateToken, CommunityController.updateRadius);

// GET /api/communities/:id - Get community by ID
router.get('/communities/:id', optionalAuth, CommunityController.getCommunityById);

// GET /api/communities/:id/debug-membership - Debug user membership
router.get('/communities/:id/debug-membership', optionalAuth, CommunityController.checkUserMemberships);

// GET /api/communities/:id/posts - Get posts from a community
router.get('/communities/:id/posts', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { drafts = 'false' } = req.query;
    const includeDrafts = drafts === 'true';
    const { pool } = require('../db');
    
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.updated_at, p.is_draft,
             p.upvotes, p.downvotes, p.share_count, p.comment_count, p.community_id,
             u.username as author_name, u.id as author_id, c.name as community_name
      FROM posts p
      JOIN users u ON p.author = u.id
      JOIN communities c ON p.community_id = c.id
      WHERE p.community_id = $1 AND (p.is_draft = false OR $2 = true)
      ORDER BY p.created_at DESC
    `, [id, includeDrafts]);
    
    res.json({
      success: true,
      message: 'Community posts retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching community posts:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      details: err.message 
    });
  }
});

// GET /api/subclubs/:id/posts - Get posts from a subclub
router.get('/subclubs/:id/posts', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { drafts = 'false' } = req.query;
    const includeDrafts = drafts === 'true';
    const { pool } = require('../db');
    
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.updated_at, p.is_draft,
             p.upvotes, p.downvotes, p.share_count, p.comment_count, p.sub_club_id,
             u.username as author_name, u.id as author_id, 
             sc.name as sub_club_name, c.name as community_name
      FROM posts p
      JOIN users u ON p.author = u.id
      JOIN sub_clubs sc ON p.sub_club_id = sc.id
      LEFT JOIN communities c ON sc.community_id = c.id
      WHERE p.sub_club_id = $1 AND (p.is_draft = false OR $2 = true)
      ORDER BY p.created_at DESC
    `, [id, includeDrafts]);
    
    res.json({
      success: true,
      message: 'Sub-club posts retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching sub-club posts:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      details: err.message 
    });
  }
});

// POST /api/communities - Create new community (requires auth)
router.post('/communities', authenticateToken, CommunityController.createCommunity);

// PUT /api/communities/:id - Update community (requires auth)
router.put('/communities/:id', authenticateToken, CommunityController.updateCommunity);

// DELETE /api/communities/:id - Delete community (requires auth)
router.delete('/communities/:id', authenticateToken, CommunityController.deleteCommunity);

// GET /api/communities/:id/members - Get community members
router.get('/communities/:id/members', optionalAuth, CommunityController.getCommunityMembers);

// POST /api/communities/:id/join - Join community (requires auth)
router.post('/communities/:id/join', authenticateToken, CommunityController.joinCommunity);

// POST /api/communities/:id/leave - Leave community (requires auth)
router.post('/communities/:id/leave', authenticateToken, CommunityController.leaveCommunity);

// GET /api/communities/:id/join-requests - Get pending join requests (requires auth)
router.get('/communities/:id/join-requests', authenticateToken, CommunityController.getCommunityJoinRequests);

// POST /api/join-requests/:requestId/handle - Handle join request (requires auth)
router.post('/join-requests/:requestId/handle', authenticateToken, CommunityController.handleJoinRequest);

// PUT /api/memberships/:membershipId/role - Update member role (requires auth)
router.put('/memberships/:membershipId/role', authenticateToken, CommunityController.updateMemberRole);

// DELETE /api/memberships/:membershipId - Remove member (requires auth)
router.delete('/memberships/:membershipId', authenticateToken, CommunityController.removeMember);

// Sub-Club Routes

// GET /api/sub-clubs - Get all sub-clubs with filters
router.get('/sub-clubs', optionalAuth, SubClubController.getAllSubClubs);

// GET /api/communities/:communityId/sub-clubs - Get sub-clubs by community
router.get('/communities/:communityId/sub-clubs', optionalAuth, SubClubController.getSubClubsByCommunity);

// GET /api/sub-clubs/my - Get user's sub-clubs (requires auth)
router.get('/sub-clubs/my', authenticateToken, SubClubController.getUserSubClubs);

// GET /api/sub-clubs/:id - Get sub-club by ID
router.get('/sub-clubs/:id', optionalAuth, SubClubController.getSubClubById);

// GET /api/subclubs/:id - Get sub-club by ID (alternative route)
router.get('/subclubs/:id', optionalAuth, SubClubController.getSubClubById);

// POST /api/sub-clubs - Create new sub-club (requires auth)
router.post('/sub-clubs', authenticateToken, SubClubController.createSubClub);

// POST /api/sub-clubs/independent - Create independent sub-club (requires auth)
router.post('/sub-clubs/independent', authenticateToken, SubClubController.createIndependentSubClub);

// PUT /api/sub-clubs/:id - Update sub-club (requires auth)
router.put('/sub-clubs/:id', authenticateToken, SubClubController.updateSubClub);

// DELETE /api/sub-clubs/:id - Delete sub-club (requires auth)
router.delete('/sub-clubs/:id', authenticateToken, SubClubController.deleteSubClub);

// GET /api/sub-clubs/:id/members - Get sub-club members
router.get('/sub-clubs/:id/members', optionalAuth, SubClubController.getSubClubMembers);

// POST /api/sub-clubs/:id/join - Join sub-club (requires auth)
router.post('/sub-clubs/:id/join', authenticateToken, SubClubController.joinSubClub);

// POST /api/sub-clubs/:id/leave - Leave sub-club (requires auth)
router.post('/sub-clubs/:id/leave', authenticateToken, SubClubController.leaveSubClub);

// POST /api/subclubs/:id/join - Join sub-club (alternative route, requires auth)
router.post('/subclubs/:id/join', authenticateToken, SubClubController.joinSubClub);

// POST /api/subclubs/:id/leave - Leave sub-club (alternative route, requires auth)
router.post('/subclubs/:id/leave', authenticateToken, SubClubController.leaveSubClub);

// GET /api/sub-clubs/:id/join-requests - Get pending join requests (requires auth)
router.get('/sub-clubs/:id/join-requests', authenticateToken, SubClubController.getSubClubJoinRequests);

module.exports = router;
