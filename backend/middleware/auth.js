const jwt = require('jsonwebtoken');

// Required authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user info to request object
    req.user = {
      id: decoded.userId || decoded.id,
      username: decoded.username,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // No token provided, continue without user info
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user info to request object
    req.user = {
      id: decoded.userId || decoded.id,
      username: decoded.username,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    // Invalid token, but continue without user info
    console.warn('Optional auth token verification failed:', error.message);
    req.user = null;
    next();
  }
};

// Legacy auth function for backward compatibility
const auth = authenticateToken;

module.exports = {
  auth,
  authenticateToken,
  optionalAuth
}; 