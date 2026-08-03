// ============================================================================
// PARKING CONTROLLER (FULL NEON POSTGRESQL + WEBSOCKET BROADCASTING)
// ============================================================================
// Implements complete CRUD operations for parking locations and individual slot
// updates from ESP32 IR sensors. All data is persisted directly in Neon PostgreSQL.
// ============================================================================

const db = require('../config/db');

/**
 * 1. GET /parkings
 * Fetches all parking locations from Neon DB along with slot count summaries.
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
    console.error('Error in getAllParkings:', error);
    return res.status(500).json({
      success: false,
      message: 'Database query error while fetching parking locations.',
    });
  }
};

/**
 * 2. GET /parking/:id
 * Fetches details for a specific parking lot along with individual slot statuses.
 */
const getParkingById = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingId = parseInt(id, 10);

    if (isNaN(parkingId)) {
      return res.status(400).json({ success: false, message: 'Invalid parking ID format.' });
    }

    // Query parking lot metadata
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

    // Query individual slots state for this parking lot
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
    console.error('Error in getParkingById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve parking location details.',
    });
  }
};

/**
 * 3. POST /createParking
 * Creates a new parking location record in Neon DB and generates initial parking_slots records.
 */
const createParking = async (req, res) => {
  try {
    const { name, address, city, latitude, longitude, total_slots } = req.body;

    if (!name || !address || !city || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, address, city, latitude, longitude.',
      });
    }

    const total = parseInt(total_slots || 10, 10);
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Insert new parking record into Neon DB
    const insertRes = await db.query(
      `INSERT INTO parkings (name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING *`,
      [name.trim(), address.trim(), city.trim(), lat, lng, total]
    );

    const newParking = insertRes.rows[0];

    // Auto-generate slot rows in parking_slots table for slot 1 to total_slots
    for (let i = 1; i <= total; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) 
         VALUES ($1, $2, FALSE)
         ON CONFLICT (parking_id, slot_number) DO NOTHING`,
        [newParking.id, i]
      );
    }

    // Fetch complete newly created parking object
    const createdParkingRes = await db.query(
      `SELECT id, name, address, city, latitude, longitude, total_slots, available_slots,
              (total_slots - available_slots) AS occupied_slots
       FROM parkings WHERE id = $1`,
      [newParking.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Parking location created successfully with slot records.',
      data: createdParkingRes.rows[0],
    });
  } catch (error) {
    console.error('Error in createParking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create parking location in database.',
    });
  }
};

/**
 * 4. PUT /parking/:id
 * Updates parking lot location, name, or total slots capacity in Neon DB.
 */
const updateParkingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingId = parseInt(id, 10);
    const { name, address, city, latitude, longitude, total_slots } = req.body;

    if (isNaN(parkingId)) {
      return res.status(400).json({ success: false, message: 'Invalid parking ID.' });
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
        name ? name.trim() : null,
        address ? address.trim() : null,
        city ? city.trim() : null,
        latitude !== undefined ? parseFloat(latitude) : null,
        longitude !== undefined ? parseFloat(longitude) : null,
        total_slots !== undefined ? parseInt(total_slots, 10) : null,
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
    console.error('Error in updateParkingDetails:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update parking details.',
    });
  }
};

/**
 * 5. DELETE /parking/:id
 * Removes a parking location and all associated slot records from Neon DB.
 */
const deleteParking = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingId = parseInt(id, 10);

    if (isNaN(parkingId)) {
      return res.status(400).json({ success: false, message: 'Invalid parking ID.' });
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
    console.error('Error in deleteParking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete parking location.',
    });
  }
};

/**
 * 6. POST /updateParking (ESP32 IR Sensor Hook Endpoint)
 * Payload format: { "parking_id": 1, "slot_number": 2, "is_occupied": true }
 * Updates slot state in Neon DB, recalculates available slots count, and emits
 * real-time WebSockets event 'parkingSlotUpdated' to all connected website clients.
 */
const updateParkingFromESP32 = async (req, res) => {
  try {
    const { parking_id, slot_number, is_occupied } = req.body;

    if (parking_id === undefined || slot_number === undefined || is_occupied === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ESP32 sensor payload. Required: parking_id, slot_number, is_occupied (boolean).',
      });
    }

    const pId = parseInt(parking_id, 10);
    const sNum = parseInt(slot_number, 10);
    const occupied = Boolean(is_occupied);

    // 1. Upsert slot status in parking_slots table
    await db.query(
      `INSERT INTO parking_slots (parking_id, slot_number, is_occupied, last_updated)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (parking_id, slot_number)
       DO UPDATE SET is_occupied = $3, last_updated = CURRENT_TIMESTAMP`,
      [pId, sNum, occupied]
    );

    // Log telemetry activity to sensor_logs table
    try {
      await db.query(
        `INSERT INTO sensor_logs (parking_id, slot_number, is_occupied) VALUES ($1, $2, $3)`,
        [pId, sNum, occupied]
      );
    } catch (logErr) {
      console.warn('Telemetry log insertion warning:', logErr.message);
    }

    // 2. Count current free slots for this parking lot
    const freeCountRes = await db.query(
      `SELECT COUNT(*) AS free_count FROM parking_slots WHERE parking_id = $1 AND is_occupied = FALSE`,
      [pId]
    );
    const newAvailable = parseInt(freeCountRes.rows[0].free_count, 10);

    // 3. Update available_slots count in parkings table
    const updateParkingRes = await db.query(
      `UPDATE parkings 
       SET available_slots = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, name, address, city, latitude, longitude, total_slots, available_slots, 
                 (total_slots - $1) AS occupied_slots`,
      [newAvailable, pId]
    );

    const updatedParkingObj = updateParkingRes.rows[0] || null;

    // 4. Construct WebSockets payload
    const eventPayload = {
      parking_id: pId,
      slot_number: sNum,
      is_occupied: occupied,
      updated_parking: updatedParkingObj,
      timestamp: new Date().toISOString(),
    };

    // 5. Broadcast real-time Socket.IO event to all frontend clients
    const io = req.app.get('io');
    if (io) {
      io.emit('parkingSlotUpdated', eventPayload);
      console.log(`📡 ESP32 Sensor Hook: Updated Lot #${pId}, Slot #${sNum} -> Occupied: ${occupied}. Broadcasted via WebSockets.`);
    }

    return res.status(200).json({
      success: true,
      message: 'ESP32 sensor status updated successfully.',
      data: eventPayload,
    });
  } catch (error) {
    console.error('Error in updateParkingFromESP32:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process ESP32 sensor update.',
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
