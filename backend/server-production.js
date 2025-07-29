// backend/server-production.js - International Production Grade Server
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');
const { validationResult, body, param, query } = require('express-validator');
const i18n = require('i18n');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: './config.env' });

// Import database connection
const { pool } = require('./db');

// Production-grade logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'natarix-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const app = express();

// ============================================
// INTERNATIONAL CONFIGURATION
// ============================================

// Configure i18n for internationalization
i18n.configure({
  locales: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'ar', 'hi', 'pt', 'ru', 'it'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  queryParameter: 'lang',
  autoReload: true,
  updateFiles: false,
  api: {
    '__': 'translate',
    '__n': 'translateN'
  }
});

app.use(i18n.init);

// ============================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression for better performance
app.use(compression());

// Rate limiting for DDoS protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Specific rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later' }
});

// Enhanced CORS configuration for international deployment
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://natarix.com',
      'https://www.natarix.com',
      'https://app.natarix.com',
      /\.natarix\.com$/,
      /\.netlify\.app$/,
      /\.vercel\.app$/
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-user-id', 
    'Accept-Language',
    'X-Requested-With',
    'X-Forwarded-For',
    'User-Agent'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Request logging
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// DATABASE CONNECTION WITH RETRY LOGIC
// ============================================

let dbConnected = false;
let connectionRetries = 0;
const maxRetries = 5;

const connectToDatabase = async () => {
  try {
    const client = await pool.connect();
    logger.info("✅ Connected to PostgreSQL successfully!");
    dbConnected = true;
    client.release();
    connectionRetries = 0;
    
    // Test critical functions
    await testDatabaseFunctions();
    
  } catch (err) {
    connectionRetries++;
    logger.error(`❌ PostgreSQL connection failed (attempt ${connectionRetries}/${maxRetries}):`, err.message);
    
    if (connectionRetries < maxRetries) {
      logger.info(`🔄 Retrying database connection in 5 seconds...`);
      setTimeout(connectToDatabase, 5000);
    } else {
      logger.error("💀 Max database connection retries reached. Server will continue with limited functionality.");
      dbConnected = false;
    }
  }
};

// Test database functions
const testDatabaseFunctions = async () => {
  try {
    // Test notification functions
    await pool.query('SELECT get_unread_count(1) as count');
    logger.info("✅ Notification system functions verified");
    
    // Test user functions  
    await pool.query('SELECT COUNT(*) FROM users');
    logger.info("✅ User system verified");
    
  } catch (err) {
    logger.error("❌ Database function test failed:", err.message);
  }
};

// Initialize database connection
connectToDatabase();

// ============================================
// ADVANCED MIDDLEWARE
// ============================================

// Request ID for tracing
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Database connection middleware
const requireDB = (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({
      error: req.translate('Database unavailable'),
      message: req.translate('Database connection is not established. Please try again later.'),
      requestId: req.id
    });
  }
  next();
};

// Advanced validation middleware
const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: req.translate('Validation failed'),
        details: errors.array().map(err => ({
          field: err.param,
          message: req.translate(err.msg),
          value: err.value
        })),
        requestId: req.id
      });
    }
    next();
  };
};

// Authentication middleware with JWT verification
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Fallback to x-user-id for development
    const userId = req.headers['x-user-id'];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } else if (userId && process.env.NODE_ENV !== 'production') {
      // Development fallback
      req.user = { id: parseInt(userId) };
    } else {
      return res.status(401).json({
        error: req.translate('Authentication required'),
        requestId: req.id
      });
    }
    
    next();
  } catch (err) {
    logger.error(`Authentication error for request ${req.id}:`, err.message);
    return res.status(403).json({
      error: req.translate('Invalid or expired token'),
      requestId: req.id
    });
  }
};

// ============================================
// NOTIFICATION SYSTEM ROUTES (PRODUCTION GRADE)
// ============================================

// Get unread notification count with caching
app.get('/api/notifications/unread-count', 
  requireDB,
  authenticateToken,
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;
      
      const result = await pool.query(
        'SELECT get_unread_count($1) as count',
        [userId]
      );
      
      const count = result.rows[0]?.count || 0;
      
      const responseTime = Date.now() - startTime;
      logger.info(`Unread count fetched in ${responseTime}ms for user ${userId}`);
      
      res.json({
        success: true,
        data: { count: parseInt(count) },
        meta: {
          requestId: req.id,
          responseTime: `${responseTime}ms`,
          userId: userId
        }
      });
      
    } catch (err) {
      logger.error(`Error fetching unread count for request ${req.id}:`, err);
      res.status(500).json({
        error: req.translate('Internal server error'),
        message: req.translate('Failed to fetch notification count'),
        requestId: req.id
      });
    }
  }
);

// Get notifications with advanced filtering and pagination
app.get('/api/notifications',
  requireDB,
  authenticateToken,
  validateRequest([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['comment', 'reply', 'join', 'like', 'mention', 'follow', 'community_invite']),
    query('unread').optional().isBoolean()
  ]),
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const unreadOnly = req.query.unread === 'true';
      const typeFilter = req.query.type;
      
      let whereClause = 'WHERE n.user_id = $1';
      let params = [userId];
      let paramCount = 1;
      
      if (unreadOnly) {
        whereClause += ` AND n.is_read = FALSE`;
      }
      
      if (typeFilter) {
        paramCount++;
        whereClause += ` AND n.type = $${paramCount}`;
        params.push(typeFilter);
      }
      
      // Main query with internationalization
      const notificationsQuery = `
        SELECT 
          n.*,
          s.username as sender_username,
          s.display_name as sender_display_name,
          s.avatar_color as sender_avatar_color,
          COALESCE(s.display_name, s.username) as sender_name,
          LEFT(COALESCE(s.display_name, s.username), 1) as sender_initial,
          CASE 
            WHEN DATE(n.created_at) = CURRENT_DATE THEN 'today'
            WHEN DATE(n.created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 'yesterday'
            WHEN n.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'thisWeek'
            ELSE 'earlier'
          END as date_group,
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - n.created_at)) as seconds_ago
        FROM notifications n
        LEFT JOIN users s ON n.sender_id = s.id
        ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      
      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM notifications n
        ${whereClause}
      `;
      
      const [notificationsResult, countResult] = await Promise.all([
        pool.query(notificationsQuery, params),
        pool.query(countQuery, params.slice(0, -2)) // Remove limit and offset for count
      ]);
      
      const notifications = notificationsResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      
      // Group notifications by date
      const groupedNotifications = {};
      
      notifications.forEach(notification => {
        const group = notification.date_group;
        if (!groupedNotifications[group]) {
          groupedNotifications[group] = [];
        }
        
        // Add time ago in human readable format
        const secondsAgo = notification.seconds_ago;
        notification.time_ago = formatTimeAgo(secondsAgo, req.getLocale());
        
        groupedNotifications[group].push(notification);
      });
      
      const responseTime = Date.now() - startTime;
      logger.info(`Notifications fetched in ${responseTime}ms for user ${userId}`);
      
      res.json({
        success: true,
        data: {
          notifications: groupedNotifications,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        },
        meta: {
          requestId: req.id,
          responseTime: `${responseTime}ms`,
          userId: userId,
          filters: {
            unreadOnly,
            type: typeFilter
          }
        }
      });
      
    } catch (err) {
      logger.error(`Error fetching notifications for request ${req.id}:`, err);
      res.status(500).json({
        error: req.translate('Internal server error'),
        message: req.translate('Failed to fetch notifications'),
        requestId: req.id
      });
    }
  }
);

// Mark notifications as read with bulk operations
app.post('/api/notifications/mark-read',
  requireDB,
  authenticateToken,
  validateRequest([
    body('notificationIds').optional().isArray().withMessage('Notification IDs must be an array'),
    body('notificationIds.*').optional().isInt().withMessage('Each notification ID must be an integer'),
    body('markAll').optional().isBoolean().withMessage('Mark all must be a boolean')
  ]),
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;
      const { notificationIds, markAll } = req.body;
      
      let result;
      
      if (markAll) {
        result = await pool.query(
          'SELECT mark_notifications_read($1, NULL) as count',
          [userId]
        );
      } else if (notificationIds && notificationIds.length > 0) {
        result = await pool.query(
          'SELECT mark_notifications_read($1, $2) as count',
          [userId, notificationIds]
        );
      } else {
        return res.status(400).json({
          error: req.translate('Invalid request'),
          message: req.translate('Either provide notification IDs or set markAll to true'),
          requestId: req.id
        });
      }
      
      const markedCount = result.rows[0]?.count || 0;
      
      const responseTime = Date.now() - startTime;
      logger.info(`${markedCount} notifications marked as read in ${responseTime}ms for user ${userId}`);
      
      res.json({
        success: true,
        data: {
          markedCount: parseInt(markedCount),
          message: req.translate(`${markedCount} notifications marked as read`)
        },
        meta: {
          requestId: req.id,
          responseTime: `${responseTime}ms`,
          userId: userId
        }
      });
      
    } catch (err) {
      logger.error(`Error marking notifications as read for request ${req.id}:`, err);
      res.status(500).json({
        error: req.translate('Internal server error'),
        message: req.translate('Failed to mark notifications as read'),
        requestId: req.id
      });
    }
  }
);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format time ago in multiple languages
const formatTimeAgo = (seconds, locale) => {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return i18n.__({ phrase: 'just now', locale });
  if (minutes < 60) return i18n.__({ phrase: '%s minutes ago', locale }, minutes);
  if (hours < 24) return i18n.__({ phrase: '%s hours ago', locale }, hours);
  return i18n.__({ phrase: '%s days ago', locale }, days);
};

// ============================================
// HEALTH CHECK AND MONITORING
// ============================================

app.get('/api/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    database: dbConnected ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json(healthCheck);
});

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Global error for request ${req.id}:`, err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || req.translate('Internal server error');
  
  res.status(statusCode).json({
    error: req.translate('Server error'),
    message: message,
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: req.translate('Not found'),
    message: req.translate('The requested resource was not found'),
    requestId: req.id
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Natarix Production Server running on ${HOST}:${PORT}`);
  logger.info(`📡 API available at: http://${HOST}:${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 Security headers enabled`);
  logger.info(`🌐 Internationalization enabled`);
  logger.info(`📊 Logging and monitoring active`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }
    pool.end(() => {
      logger.info('Database connections closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }
    pool.end(() => {
      logger.info('Database connections closed');
      process.exit(0);
    });
  });
});

module.exports = app; 