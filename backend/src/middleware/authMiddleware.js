// ============================================================================
// AUTHENTICATION MIDDLEWARE (JWT VERIFICATION)
// ============================================================================
// Intercepts requests to protected endpoints, verifies the JWT token from the
// Authorization header ('Bearer <token>'), and attaches the decoded user object
// to the request (req.user).
// ============================================================================

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach user info (id, email, role) to request
    next(); // Proceed to route handler
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

/**
 * Optional Admin Role Guard Middleware
 * Ensures that only users with role === 'admin' can access sensitive operations (like create/delete parking).
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};
