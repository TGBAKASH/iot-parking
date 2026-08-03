// ============================================================================
// AUTHENTICATION ROUTER
// ============================================================================

const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected user profile route
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
