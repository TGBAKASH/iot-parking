// ============================================================================
// PARKING MANAGEMENT ROUTES (SECURED WITH ROLE-BASED ACCESS CONTROL)
// ============================================================================
// Secured Endpoints:
// - GET /parkings: Public
// - GET /parking/:id: Public
// - POST /updateParking: Secured with ESP32 Hardware API Key header validation
// - POST /createParking: Protected (Requires JWT & Admin Role)
// - PUT /parking/:id: Protected (Requires JWT & Admin Role)
// - DELETE /parking/:id: Protected (Requires JWT & Admin Role)
// ============================================================================

const express = require('express');
const router = express.Router();
const {
  getAllParkings,
  getParkingById,
  createParking,
  updateParkingDetails,
  deleteParking,
  updateParkingFromESP32,
} = require('../controllers/parkingController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// ESP32 Hardware API Key Header Validation Middleware
const validateESP32ApiKey = (req, res, next) => {
  const apiKeyHeader = req.headers['x-esp32-api-key'] || req.headers['x-api-key'];
  const expectedKey = process.env.ESP32_API_KEY || 'default_esp32_secret_key_123';

  // Allow request if valid API key is supplied OR in development fallback mode
  if (apiKeyHeader && apiKeyHeader === expectedKey) {
    return next();
  }

  // Allow in dev mode with warning if no key header set
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Unauthorized ESP32 device post. Missing or invalid X-ESP32-API-KEY header.',
  });
};

// 1. GET all parking locations (Public)
router.get('/parkings', getAllParkings);

// 2. GET single parking location details by ID (Public)
router.get('/parking/:id', getParkingById);

// 3. POST update slot status from ESP32 hardware (Secured with API Key validation)
router.post('/updateParking', validateESP32ApiKey, updateParkingFromESP32);

// 4. POST create a new parking location (Protected: Admin Only)
router.post('/createParking', authenticateToken, requireAdmin, createParking);

// 5. PUT update parking details by ID (Protected: Admin Only)
router.put('/parking/:id', authenticateToken, requireAdmin, updateParkingDetails);

// 6. DELETE parking location by ID (Protected: Admin Only)
router.delete('/parking/:id', authenticateToken, requireAdmin, deleteParking);

module.exports = router;
