// backend/routes/discovery.route.js
const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Get all discovery sections
router.get('/', async (req, res) => {
  try {
    const { section, lat, lng, radius = 10, search, offset = 0, limit = 20 } = req.query;
    
    // If specific section requested
    if (section) {
      let communities;
      switch (section) {
        case 'trending':
          communities = await getTrendingCommunities(limit, offset);
          break;
        case 'nearby':
          if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude required for nearby communities' });
          }
          communities = await getNearbyCommunities(lat, lng, radius, limit, offset);
          break;
        case 'popular':
          communities = await getPopularCommunities(limit, offset);
          break;
        case 'latest':
          communities = await getLatestCommunities(limit, offset);
          break;
        default:
          return res.status(400).json({ error: 'Invalid section' });
      }
      return res.json({ [section]: communities });
    }

    // Search functionality
    if (search) {
      const searchResults = await searchCommunities(search, limit, offset);
      return res.json({ search: searchResults });
    }

    // Get all sections
    const [trending, popular, latest] = await Promise.all([
      getTrendingCommunities(10, 0),
      getPopularCommunities(10, 0),
      getLatestCommunities(10, 0)
    ]);

    let nearby = [];
    if (lat && lng) {
      nearby = await getNearbyCommunities(lat, lng, radius, 10, 0);
    }

    const totalCounts = await getTotalCounts();

    res.json({
      trending,
      nearby,
      popular,
      latest,
      totalCounts
    });

  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trending communities (last 7 days activity)
async function getTrendingCommunities(limit, offset) {
  const query = `
    SELECT c.*, 
           c.member_count,
           c.post_count,
           c.last_active,
           (c.member_count + c.post_count * 2) as activity_score
    FROM communities c
    WHERE c.last_active >= NOW() - INTERVAL '7 days'
    ORDER BY activity_score DESC, c.last_active DESC
    LIMIT $1 OFFSET $2
  `;
  
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
}

// Get nearby communities using Haversine formula
async function getNearbyCommunities(lat, lng, radius, limit, offset) {
  const query = `
    SELECT c.*,
           c.member_count,
           c.post_count,
           (6371 * acos(
             cos(radians($1)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians($2))
             + sin(radians($1)) * sin(radians(c.latitude))
           )) AS distance
    FROM communities c
    WHERE c.type = 'location_bound'
      AND c.latitude IS NOT NULL 
      AND c.longitude IS NOT NULL
    HAVING distance < $3
    ORDER BY distance ASC
    LIMIT $4 OFFSET $5
  `;
  
  const result = await pool.query(query, [lat, lng, radius, limit, offset]);
  return result.rows;
}

// Get popular communities by member count
async function getPopularCommunities(limit, offset) {
  const query = `
    SELECT c.*,
           c.member_count,
           c.post_count,
           c.last_active
    FROM communities c
    ORDER BY c.member_count DESC, c.post_count DESC
    LIMIT $1 OFFSET $2
  `;
  
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
}

// Get latest communities
async function getLatestCommunities(limit, offset) {
  const query = `
    SELECT c.*,
           c.member_count,
           c.post_count,
           c.last_active
    FROM communities c
    ORDER BY c.created_at DESC
    LIMIT $1 OFFSET $2
  `;
  
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
}

// Search communities by name
async function searchCommunities(searchTerm, limit, offset) {
  const query = `
    SELECT c.*,
           c.member_count,
           c.post_count,
           c.last_active
    FROM communities c
    WHERE LOWER(c.name) LIKE '%' || LOWER($1) || '%'
       OR LOWER(c.description) LIKE '%' || LOWER($1) || '%'
    ORDER BY c.member_count DESC
    LIMIT $2 OFFSET $3
  `;
  
  const result = await pool.query(query, [searchTerm, limit, offset]);
  return result.rows;
}

// Get total counts for statistics
async function getTotalCounts() {
  const queries = await Promise.all([
    pool.query('SELECT COUNT(*) as total FROM communities'),
    pool.query('SELECT COUNT(*) as trending FROM communities WHERE last_active >= NOW() - INTERVAL \'7 days\''),
    pool.query('SELECT COUNT(*) as location_bound FROM communities WHERE type = \'location_bound\'')
  ]);

  return {
    total: parseInt(queries[0].rows[0].total),
    trending: parseInt(queries[1].rows[0].trending),
    locationBound: parseInt(queries[2].rows[0].location_bound)
  };
}

module.exports = router; 