// ============================================================================
// PARKING CONTROLLER (DEEP SECURITY AUDITED & SANITIZED)
// ============================================================================
// Features:
// - Strict coordinate range validation (-90 to 90 lat, -180 to 180 lng)
// - Capacity bounds enforcement (1 to 500 slots)
// - Input string sanitization to prevent XSS & SQL parameter corruption
// - ESP32 payload validation and real-time WebSockets broadcasting
// ============================================================================

const db = require('../config/db');
const validator = require('validator');

/**
 * 1. GET /parkings
 * Fetches all parking locations from Neon DB.
 */
const getAllParkings = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         p.id, 
         p.name, 
         p.address, 
         p.city, 
         p.latitude, 
         p.longitude, 
         p.total_slots, 
         p.available_slots, 
         (p.total_slots - p.available_slots) AS occupied_slots,
         p.created_at,
         p.updated_at
       FROM parkings p
       ORDER BY p.id ASC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Secure Log - getAllParkings Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve parking locations.',
    });
  }
};

/**
 * 2. GET /parking/:id
 * Fetches details and slot statuses for a specific parking lot.
 */
const getParkingById = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingId = parseInt(id, 10);

    if (isNaN(parkingId) || parkingId <= 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: Invalid parking ID.' });
    }

    const parkingRes = await db.query(
      `SELECT 
         p.id, 
         p.name, 
         p.address, 
         p.city, 
         p.latitude, 
         p.longitude, 
         p.total_slots, 
         p.available_slots, 
         (p.total_slots - p.available_slots) AS occupied_slots,
         p.created_at,
         p.updated_at
       FROM parkings p 
       WHERE p.id = $1`,
      [parkingId]
    );

    if (parkingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking location not found.' });
    }

    const parkingData = parkingRes.rows[0];

    const slotsRes = await db.query(
      `SELECT id, slot_number, is_occupied, last_updated 
       FROM parking_slots 
       WHERE parking_id = $1 
       ORDER BY slot_number ASC`,
      [parkingId]
    );

    parkingData.slots = slotsRes.rows;

    return res.status(200).json({
      success: true,
      data: parkingData,
    });
  } catch (error) {
    console.error('Secure Log - getParkingById Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve parking details.',
    });
  }
};

/**
 * 3. POST /createParking
 * Creates a new parking location (Protected: Admin Only).
 */
const createParking = async (req, res) => {
  try {
    const { name, address, city, latitude, longitude, total_slots } = req.body;

    if (!name || !address || !city || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Missing required fields: name, address, city, latitude, longitude.',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const total = parseInt(total_slots || 10, 10);

    // Validate coordinate range
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ success: false, message: 'Validation Error: Latitude must be between -90 and 90.' });
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Validation Error: Longitude must be between -180 and 180.' });
    }

    // Validate slot bounds
    if (isNaN(total) || total < 1 || total > 500) {
      return res.status(400).json({ success: false, message: 'Validation Error: Total slots must be between 1 and 500.' });
    }

    // Sanitize string inputs
    const cleanName = validator.escape(name.trim());
    const cleanAddress = validator.escape(address.trim());
    const cleanCity = validator.escape(city.trim());

    // Insert into Neon DB
    const insertRes = await db.query(
      `INSERT INTO parkings (name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING *`,
      [cleanName, cleanAddress, cleanCity, lat, lng, total]
    );

    const newParking = insertRes.rows[0];

    // Generate initial slot rows
    for (let i = 1; i <= total; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) 
         VALUES ($1, $2, FALSE)
         ON CONFLICT (parking_id, slot_number) DO NOTHING`,
        [newParking.id, i]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Parking location created successfully.',
      data: newParking,
    });
  } catch (error) {
    console.error('Secure Log - createParking Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create parking location.',
    });
  }
};

/**
 * 4. PUT /parking/:id
 * Updates parking lot location details (Protected: Admin Only).
 */
const updateParkingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingId = parseInt(id, 10);

    if (isNaN(parkingId) || parkingId <= 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: Invalid parking ID.' });
    }

    const { name, address, city, latitude, longitude, total_slots } = req.body;

    let cleanLat = null;
    let cleanLng = null;
    let cleanTotal = null;

    if (latitude !== undefined) {
      cleanLat = parseFloat(latitude);
      if (isNaN(cleanLat) || cleanLat < -90 || cleanLat > 90) {
        return res.status(400).json({ success: false, message: 'Validation Error: Invalid latitude.' });
      }
    }

    if (longitude !== undefined) {
      cleanLng = parseFloat(longitude);
      if (isNaN(cleanLng) || cleanLng < -180 || cleanLng > 180) {
        return res.status(400).json({ success: false, message: 'Validation Error: Invalid longitude.' });
      }
    }

    if (total_slots !== undefined) {
      cleanTotal = parseInt(total_slots, 10);
      if (isNaN(cleanTotal) || cleanTotal < 1 || cleanTotal > 500) {
        return res.status(400).json({ success: false, message: 'Validation Error: Total slots must be between 1 and 500.' });
      }
    }

    const updateRes = await db.query(
      `UPDATE parkings
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           city = COALESCE($3, city),
           latitude = COALESCE($4, latitude),
           longitude = COALESCE($5, longitude),
           total_slots = COALESCE($6, total_slots),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        name ? validator.escape(name.trim()) : null,
        address ? validator.escape(address.trim()) : null,
        city ? validator.escape(city.trim()) : null,
        cleanLat,
        cleanLng,
        cleanTotal,
        parkingId,
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking location not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Parking details updated successfully.',
      data: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Secure Log - updateParkingDetails Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update parking location.',
    });
  }
};

/**
 * 5. DELETE /parking/:id
 * Removes a parking location (Protected: Admin Only).
 */
const deleteParking = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingId = parseInt(id, 10);

    if (isNaN(parkingId) || parkingId <= 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: Invalid parking ID.' });
    }

    const deleteRes = await db.query('DELETE FROM parkings WHERE id = $1 RETURNING id', [parkingId]);

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking location not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Parking lot #${parkingId} deleted successfully.`,
    });
  } catch (error) {
    console.error('Secure Log - deleteParking Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete parking location.',
    });
  }
};

/**
 * 6. POST /updateParking (ESP32 Sensor Hook Endpoint)
 */
const updateParkingFromESP32 = async (req, res) => {
  try {
    const { parking_id, slot_number, is_occupied } = req.body;

    if (parking_id === undefined || slot_number === undefined || is_occupied === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Missing required fields: parking_id, slot_number, is_occupied.',
      });
    }

    const pId = parseInt(parking_id, 10);
    const sNum = parseInt(slot_number, 10);
    const occupied = Boolean(is_occupied);

    if (isNaN(pId) || pId <= 0 || isNaN(sNum) || sNum <= 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: Invalid parking_id or slot_number.' });
    }

    // 1. Upsert slot state
    await db.query(
      `INSERT INTO parking_slots (parking_id, slot_number, is_occupied, last_updated)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (parking_id, slot_number)
       DO UPDATE SET is_occupied = $3, last_updated = CURRENT_TIMESTAMP`,
      [pId, sNum, occupied]
    );

    // 2. Log telemetry event
    try {
      await db.query(
        `INSERT INTO sensor_logs (parking_id, slot_number, is_occupied) VALUES ($1, $2, $3)`,
        [pId, sNum, occupied]
      );
    } catch (logErr) {
      console.warn('Telemetry log insertion warning:', logErr.message);
    }

    // 3. Recalculate available slots
    const freeCountRes = await db.query(
      `SELECT COUNT(*) AS free_count FROM parking_slots WHERE parking_id = $1 AND is_occupied = FALSE`,
      [pId]
    );
    const newAvailable = parseInt(freeCountRes.rows[0].free_count, 10);

    const updateParkingRes = await db.query(
      `UPDATE parkings 
       SET available_slots = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, name, address, city, latitude, longitude, total_slots, available_slots, 
                 (total_slots - $1) AS occupied_slots`,
      [newAvailable, pId]
    );

    const updatedParkingObj = updateParkingRes.rows[0] || null;

    const eventPayload = {
      parking_id: pId,
      slot_number: sNum,
      is_occupied: occupied,
      updated_parking: updatedParkingObj,
      timestamp: new Date().toISOString(),
    };

    const io = req.app.get('io');
    if (io) {
      io.emit('parkingSlotUpdated', eventPayload);
    }

    return res.status(200).json({
      success: true,
      message: 'ESP32 sensor status updated successfully.',
      data: eventPayload,
    });
  } catch (error) {
    console.error('Secure Log - updateParkingFromESP32 Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process sensor update.',
    });
  }
};

module.exports = {
  getAllParkings,
  getParkingById,
  createParking,
  updateParkingDetails,
  deleteParking,
  updateParkingFromESP32,
};
