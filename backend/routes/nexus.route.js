// backend/routes/nexus.route.js - Advanced Community Nexus API
const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Enhanced Community Nexus endpoint with deep database integration
router.get('/', async (req, res) => {
  try {
    const { 
      view = 'discovery', 
      filter = 'all', 
      sort = 'trending',
      search, 
      lat, 
      lng, 
      radius = 10, 
      limit = 20, 
      offset = 0,
      user_id 
    } = req.query;

    console.log('🚀 Nexus API called with params:', req.query);

    let response = {};

    if (search) {
      // Advanced search with full-text search and ranking
      const searchResults = await performAdvancedSearch(search, limit, offset, user_id);
      response.search = searchResults;
      response.searchMeta = {
        query: search,
        total: searchResults.length,
        hasMore: searchResults.length === parseInt(limit)
      };
    } else if (view === 'discovery') {
      // Get all discovery sections with analytics
      const [trending, nearby, popular, latest, analytics] = await Promise.all([
        getTrendingCommunities(10, 0, user_id),
        lat && lng ? getNearbyCommunities(lat, lng, radius, 10, 0, user_id) : [],
        getPopularCommunities(10, 0, user_id),
        getLatestCommunities(10, 0, user_id),
        getCommunityAnalytics()
      ]);

      response = {
        trending,
        nearby,
        popular,
        latest,
        analytics,
        totalCounts: {
          total: analytics.totalCommunities,
          trending: analytics.trendingCount,
          locationBound: analytics.locationBoundCount,
          userJoined: user_id ? analytics.userJoinedCount : 0
        }
      };
    } else {
      // Filtered view with advanced sorting
      const communities = await getFilteredCommunities(filter, sort, limit, offset, user_id, lat, lng, radius);
      response.communities = communities;
      response.meta = {
        filter,
        sort,
        total: communities.length,
        hasMore: communities.length === parseInt(limit)
      };
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Nexus API error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Advanced search with ranking and relevance scoring
async function performAdvancedSearch(searchTerm, limit, offset, userId) {
  const query = `
    WITH search_results AS (
      SELECT 
        c.*,
        c.member_count,
        c.post_count,
        c.last_active,
        CASE WHEN m.user_id IS NOT NULL THEN true ELSE false END as is_joined,
        m.role as user_role,
        -- Relevance scoring
        (
          CASE WHEN LOWER(c.name) = LOWER($1) THEN 100 ELSE 0 END +
          CASE WHEN LOWER(c.name) LIKE LOWER($1) || '%' THEN 50 ELSE 0 END +
          CASE WHEN LOWER(c.name) LIKE '%' || LOWER($1) || '%' THEN 25 ELSE 0 END +
          CASE WHEN LOWER(c.description) LIKE '%' || LOWER($1) || '%' THEN 15 ELSE 0 END +
          CASE WHEN LOWER(c.location) LIKE '%' || LOWER($1) || '%' THEN 10 ELSE 0 END +
          (c.member_count * 0.1) +
          (c.post_count * 0.05)
        ) as relevance_score
      FROM communities c
      LEFT JOIN community_memberships m ON c.id = m.community_id AND m.user_id = $4
      WHERE 
        LOWER(c.name) LIKE '%' || LOWER($1) || '%'
        OR LOWER(c.description) LIKE '%' || LOWER($1) || '%'
        OR LOWER(c.location) LIKE '%' || LOWER($1) || '%'
    )
    SELECT * FROM search_results
    WHERE relevance_score > 0
    ORDER BY relevance_score DESC, member_count DESC, created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const result = await pool.query(query, [searchTerm, limit, offset, userId]);
  return result.rows;
}

// Enhanced trending communities with activity scoring
async function getTrendingCommunities(limit, offset, userId) {
  const query = `
    WITH trending_scores AS (
      SELECT 
        c.*,
        CASE WHEN m.user_id IS NOT NULL THEN true ELSE false END as is_joined,
        m.role as user_role,
        -- Advanced trending algorithm
        (
          (c.member_count * 1.0) +
          (c.post_count * 2.0) +
          CASE 
            WHEN c.last_active >= NOW() - INTERVAL '1 day' THEN 50
            WHEN c.last_active >= NOW() - INTERVAL '3 days' THEN 30
            WHEN c.last_active >= NOW() - INTERVAL '7 days' THEN 15
            ELSE 0
          END +
          -- Recent growth bonus
          COALESCE(
            (SELECT COUNT(*) * 5 FROM community_memberships WHERE community_id = c.id AND joined_at >= NOW() - INTERVAL '7 days'),
            0
          ) +
          COALESCE(
            (SELECT COUNT(*) * 3 FROM posts WHERE community_id = c.id AND created_at >= NOW() - INTERVAL '7 days'),
            0
          )
        ) as trending_score
      FROM communities c
      LEFT JOIN community_memberships m ON c.id = m.community_id AND m.user_id = $3
      WHERE c.last_active >= NOW() - INTERVAL '30 days'
    )
    SELECT * FROM trending_scores
    ORDER BY trending_score DESC, last_active DESC
    LIMIT $1 OFFSET $2
  `;
  
  const result = await pool.query(query, [limit, offset, userId]);
  return result.rows;
}

// Enhanced nearby communities with distance calculation
async function getNearbyCommunities(lat, lng, radius, limit, offset, userId) {
  const query = `
    SELECT 
      c.*,
      CASE WHEN m.user_id IS NOT NULL THEN true ELSE false END as is_joined,
      m.role as user_role,
      -- Haversine distance calculation
      (
        6371 * acos(
          cos(radians($1)) * cos(radians(c.latitude)) * 
          cos(radians(c.longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(c.latitude))
        )
      ) AS distance
    FROM communities c
    LEFT JOIN community_memberships m ON c.id = m.community_id AND m.user_id = $6
    WHERE 
      c.type = 'location_bound'
      AND c.latitude IS NOT NULL 
      AND c.longitude IS NOT NULL
      AND (
        6371 * acos(
          cos(radians($1)) * cos(radians(c.latitude)) * 
          cos(radians(c.longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(c.latitude))
        )
      ) < $3
    ORDER BY distance ASC, member_count DESC
    LIMIT $4 OFFSET $5
  `;
  
  const result = await pool.query(query, [lat, lng, radius, limit, offset, userId]);
  return result.rows;
}

// Enhanced popular communities with engagement metrics
async function getPopularCommunities(limit, offset, userId) {
  const query = `
    WITH popularity_metrics AS (
      SELECT 
        c.*,
        CASE WHEN m.user_id IS NOT NULL THEN true ELSE false END as is_joined,
        m.role as user_role,
        -- Popularity score combining multiple factors
        (
          (c.member_count * 1.0) +
          (c.post_count * 0.5) +
          COALESCE(
            (SELECT AVG(CASE WHEN vote_type = 'upvote' THEN 1 ELSE -1 END) * 10
             FROM post_votes v 
             JOIN posts p ON v.post_id = p.id 
             WHERE p.community_id = c.id),
            0
          )
        ) as popularity_score
      FROM communities c
      LEFT JOIN community_memberships m ON c.id = m.community_id AND m.user_id = $3
    )
    SELECT * FROM popularity_metrics
    ORDER BY popularity_score DESC, member_count DESC
    LIMIT $1 OFFSET $2
  `;
  
  const result = await pool.query(query, [limit, offset, userId]);
  return result.rows;
}

// Enhanced latest communities with quality indicators
async function getLatestCommunities(limit, offset, userId) {
  const query = `
    SELECT 
      c.*,
      CASE WHEN m.user_id IS NOT NULL THEN true ELSE false END as is_joined,
      m.role as user_role,
      -- Quality indicators for new communities
      CASE 
        WHEN c.member_count >= 50 THEN 'established'
        WHEN c.member_count >= 10 THEN 'growing'
        ELSE 'new'
      END as community_status,
      EXTRACT(DAYS FROM NOW() - c.created_at) as days_old
    FROM communities c
    LEFT JOIN community_memberships m ON c.id = m.community_id AND m.user_id = $3
    ORDER BY c.created_at DESC
    LIMIT $1 OFFSET $2
  `;
  
  const result = await pool.query(query, [limit, offset, userId]);
  return result.rows;
}

// Advanced filtered communities with multiple criteria
async function getFilteredCommunities(filter, sort, limit, offset, userId, lat, lng, radius) {
  let whereClause = '';
  let orderClause = '';
  let joinClause = `LEFT JOIN community_memberships m ON c.id = m.community_id AND m.user_id = $6`;
  let params = [limit, offset, userId];

  // Apply filters
  switch (filter) {
    case 'joined':
      whereClause = 'WHERE m.user_id IS NOT NULL';
      break;
    case 'location_bound':
      whereClause = `WHERE c.type = 'location_bound'`;
      break;
    case 'global':
      whereClause = `WHERE c.type = 'agnostic'`;
      break;
    case 'nearby':
      if (lat && lng) {
        whereClause = `
          WHERE c.type = 'location_bound'
          AND c.latitude IS NOT NULL 
          AND c.longitude IS NOT NULL
          AND (
            6371 * acos(
              cos(radians($4)) * cos(radians(c.latitude)) * 
              cos(radians(c.longitude) - radians($5)) + 
              sin(radians($4)) * sin(radians(c.latitude))
            )
          ) < $6
        `;
        params.push(lat, lng, radius);
      }
      break;
  }

  // Apply sorting
  switch (sort) {
    case 'members':
      orderClause = 'ORDER BY c.member_count DESC, c.created_at DESC';
      break;
    case 'activity':
      orderClause = 'ORDER BY c.post_count DESC, c.last_active DESC';
      break;
    case 'name':
      orderClause = 'ORDER BY c.name ASC';
      break;
    case 'newest':
      orderClause = 'ORDER BY c.created_at DESC';
      break;
    case 'trending':
    default:
      orderClause = `
        ORDER BY 
          (c.member_count + c.post_count * 2 + 
           CASE WHEN c.last_active >= NOW() - INTERVAL '7 days' THEN 50 ELSE 0 END
          ) DESC,
          c.last_active DESC
      `;
      break;
  }

  const query = `
    SELECT 
      c.*,
      c.member_count,
      c.post_count,
      c.last_active,
      CASE WHEN m.user_id IS NOT NULL THEN true ELSE false END as is_joined,
      m.role as user_role
      ${lat && lng && filter === 'nearby' ? `, (
        6371 * acos(
          cos(radians($4)) * cos(radians(c.latitude)) * 
          cos(radians(c.longitude) - radians($5)) + 
          sin(radians($4)) * sin(radians(c.latitude))
        )
      ) AS distance` : ''}
    FROM communities c
    ${joinClause}
    ${whereClause}
    ${orderClause}
    LIMIT $1 OFFSET $2
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

// Comprehensive community analytics
async function getCommunityAnalytics() {
  const queries = await Promise.all([
    pool.query('SELECT COUNT(*) as total FROM communities'),
    pool.query(`
      SELECT COUNT(*) as trending 
      FROM communities 
      WHERE last_active >= NOW() - INTERVAL '7 days'
    `),
    pool.query(`
      SELECT COUNT(*) as location_bound 
      FROM communities 
      WHERE type = 'location_bound'
    `),
    pool.query(`
      SELECT 
        AVG(member_count) as avg_members,
        AVG(post_count) as avg_posts,
        MAX(member_count) as max_members,
        MIN(member_count) as min_members
      FROM communities
    `),
    pool.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as count
      FROM communities 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `)
  ]);

  const stats = queries[3].rows[0];
  const growthData = queries[4].rows;

  return {
    totalCommunities: parseInt(queries[0].rows[0].total),
    trendingCount: parseInt(queries[1].rows[0].trending),
    locationBoundCount: parseInt(queries[2].rows[0].location_bound),
    avgMembers: parseFloat(stats.avg_members).toFixed(1),
    avgPosts: parseFloat(stats.avg_posts).toFixed(1),
    maxMembers: parseInt(stats.max_members),
    minMembers: parseInt(stats.min_members),
    growthData: growthData.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }))
  };
}

// Get user-specific community recommendations
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const query = `
      WITH user_interests AS (
        -- Get communities user has joined
        SELECT DISTINCT c.type, c.location, c.tags
        FROM communities c
        JOIN community_memberships m ON c.id = m.community_id
        WHERE m.user_id = $1
      ),
      similar_communities AS (
        SELECT 
          c.*,
          c.member_count,
          c.post_count,
          c.last_active,
          -- Similarity score based on user's interests
          (
            CASE WHEN c.type IN (SELECT type FROM user_interests) THEN 20 ELSE 0 END +
            CASE WHEN c.location IN (SELECT location FROM user_interests WHERE location IS NOT NULL) THEN 15 ELSE 0 END +
            (c.member_count * 0.01) +
            (c.post_count * 0.005)
          ) as similarity_score
        FROM communities c
        WHERE c.id NOT IN (
          SELECT community_id FROM community_memberships WHERE user_id = $1
        )
      )
      SELECT * FROM similar_communities
      WHERE similarity_score > 0
      ORDER BY similarity_score DESC, member_count DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    res.json({ recommendations: result.rows });

  } catch (error) {
    console.error('❌ Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

module.exports = router; 