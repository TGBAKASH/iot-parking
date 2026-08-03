// ============================================================================
// PARKING MANAGEMENT ROUTES
// ============================================================================
// Express Router for managing parking locations and receiving ESP32 sensor posts.
// Required API Endpoints:
// - GET /parkings
// - GET /parking/:id
// - POST /updateParking (ESP32 IR Sensor Hook)
// - POST /createParking
// - PUT /parking/:id
// - DELETE /parking/:id
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

// 1. GET all parking locations
router.get('/parkings', getAllParkings);

// 2. GET single parking location details by ID
router.get('/parking/:id', getParkingById);

// 3. POST update slot status from ESP32 sensor hardware
router.post('/updateParking', updateParkingFromESP32);

// 4. POST create a new parking location
router.post('/createParking', createParking);

// 5. PUT update parking details by ID
router.put('/parking/:id', updateParkingDetails);

// 6. DELETE parking location by ID
router.delete('/parking/:id', deleteParking);

module.exports = router;
