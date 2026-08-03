// ============================================================================
// PARKING CONTROLLER (REST API + WEBSOCKET EMITTER)
// ============================================================================
// Handles all CRUD operations for parking locations and the ESP32 sensor update
// endpoint (POST /updateParking). Broadcasts live changes to Socket.IO clients.
// ============================================================================

const db = require('../config/db');

// In-memory initial fallback data for Milestone 1 skeleton testing (if PostgreSQL is not yet populated)
let fallbackParkings = [
  {
    id: 1,
    name: 'Central Tech Parking Hub',
    address: '123 Innovation Way, Tech District',
    city: 'San Francisco',
    latitude: 37.774929,
    longitude: -122.419416,
    total_slots: 5,
    available_slots: 3,
    occupied_slots: 2,
    slots: [
      { slot_number: 1, is_occupied: false },
      { slot_number: 2, is_occupied: true },
      { slot_number: 3, is_occupied: false },
      { slot_number: 4, is_occupied: true },
      { slot_number: 5, is_occupied: false },
    ],
  },
  {
    id: 2,
    name: 'Downtown Plaza Garage',
    address: '456 Market Street',
    city: 'San Francisco',
    latitude: 37.788500,
    longitude: -122.401500,
    total_slots: 10,
    available_slots: 7,
    occupied_slots: 3,
    slots: [],
  },
  {
    id: 3,
    name: 'Metro Station Parking',
    address: '789 Transit Blvd',
    city: 'San Jose',
    latitude: 37.338208,
    longitude: -121.886329,
    total_slots: 8,
    available_slots: 4,
    occupied_slots: 4,
    slots: [],
  },
];

/**
 * 1. GET /parkings
 * Fetch all parking locations with total, available, and occupied slot counts.
 */
const getAllParkings = async (req, res) => {
  try {
    try {
      const result = await db.query(
        `SELECT id, name, address, city, latitude, longitude, total_slots, available_slots, 
               (total_slots - available_slots) as occupied_slots 
         FROM parkings ORDER BY id ASC`
      );
      if (result.rows.length > 0) {
        return res.status(200).json({ success: true, data: result.rows });
      }
    } catch (dbErr) {
      console.log('ℹ️ Operating in database skeleton mode with mock parkings list.');
    }

    return res.status(200).json({ success: true, data: fallbackParkings });
  } catch (error) {
    console.error('Error fetching parkings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch parking locations.' });
  }
};

/**
 * 2. GET /parking/:id
 * Fetch details and slot states for a specific parking lot.
 */
const getParkingById = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingId = parseInt(id, 10);

    try {
      const parkingRes = await db.query(
        `SELECT id, name, address, city, latitude, longitude, total_slots, available_slots, 
               (total_slots - available_slots) as occupied_slots 
         FROM parkings WHERE id = $1`,
        [parkingId]
      );

      if (parkingRes.rows.length > 0) {
        const slotsRes = await db.query(
          `SELECT id, slot_number, is_occupied, last_updated FROM parking_slots WHERE parking_id = $1 ORDER BY slot_number ASC`,
          [parkingId]
        );
        const parkingData = parkingRes.rows[0];
        parkingData.slots = slotsRes.rows;
        return res.status(200).json({ success: true, data: parkingData });
      }
    } catch (dbErr) {
      console.log('ℹ️ Operating in database skeleton mode for getParkingById.');
    }

    const item = fallbackParkings.find((p) => p.id === parkingId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Parking lot not found.' });
    }
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching parking by ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch parking details.' });
  }
};

/**
 * 3. POST /createParking
 * Create a new parking lot location.
 */
const createParking = async (req, res) => {
  try {
    const { name, address, city, latitude, longitude, total_slots } = req.body;

    if (!name || !address || !city || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required parking details.' });
    }

    const total = parseInt(total_slots || 10, 10);

    try {
      const result = await db.query(
        `INSERT INTO parkings (name, address, city, latitude, longitude, total_slots, available_slots)
         VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
        [name, address, city, latitude, longitude, total]
      );
      const newParking = result.rows[0];
      
      // Auto-generate slot records for this parking lot
      for (let i = 1; i <= total; i++) {
        await db.query(
          `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES ($1, $2, FALSE)`,
          [newParking.id, i]
        );
      }

      return res.status(201).json({ success: true, message: 'Parking created.', data: newParking });
    } catch (dbErr) {
      console.log('ℹ️ Fallback createParking in memory.');
    }

    const newObj = {
      id: fallbackParkings.length + 1,
      name,
      address,
      city,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      total_slots: total,
      available_slots: total,
      occupied_slots: 0,
      slots: [],
    };
    fallbackParkings.push(newObj);

    return res.status(201).json({ success: true, message: 'Parking created (fallback).', data: newObj });
  } catch (error) {
    console.error('Error creating parking:', error);
    return res.status(500).json({ success: false, message: 'Failed to create parking.' });
  }
};

/**
 * 4. PUT /parking/:id
 * Update an existing parking lot.
 */
const updateParkingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingId = parseInt(id, 10);
    const { name, address, city, latitude, longitude, total_slots } = req.body;

    try {
      const result = await db.query(
        `UPDATE parkings 
         SET name = COALESCE($1, name),
             address = COALESCE($2, address),
             city = COALESCE($3, city),
             latitude = COALESCE($4, latitude),
             longitude = COALESCE($5, longitude),
             total_slots = COALESCE($6, total_slots),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 RETURNING *`,
        [name, address, city, latitude, longitude, total_slots, parkingId]
      );
      if (result.rows.length > 0) {
        return res.status(200).json({ success: true, message: 'Parking updated.', data: result.rows[0] });
      }
    } catch (dbErr) {
      console.log('ℹ️ Fallback update parking in memory.');
    }

    const index = fallbackParkings.findIndex((p) => p.id === parkingId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Parking not found.' });
    }

    fallbackParkings[index] = {
      ...fallbackParkings[index],
      name: name || fallbackParkings[index].name,
      address: address || fallbackParkings[index].address,
      city: city || fallbackParkings[index].city,
      latitude: latitude !== undefined ? parseFloat(latitude) : fallbackParkings[index].latitude,
      longitude: longitude !== undefined ? parseFloat(longitude) : fallbackParkings[index].longitude,
      total_slots: total_slots !== undefined ? parseInt(total_slots, 10) : fallbackParkings[index].total_slots,
    };

    return res.status(200).json({ success: true, message: 'Parking updated (fallback).', data: fallbackParkings[index] });
  } catch (error) {
    console.error('Error updating parking:', error);
    return res.status(500).json({ success: false, message: 'Failed to update parking details.' });
  }
};

/**
 * 5. DELETE /parking/:id
 * Delete a parking lot.
 */
const deleteParking = async (req, res) => {
  try {
    const { id } = req.params;
    const parkingId = parseInt(id, 10);

    try {
      await db.query(`DELETE FROM parkings WHERE id = $1`, [parkingId]);
      return res.status(200).json({ success: true, message: 'Parking deleted successfully.' });
    } catch (dbErr) {
      console.log('ℹ️ Fallback delete parking in memory.');
    }

    fallbackParkings = fallbackParkings.filter((p) => p.id !== parkingId);
    return res.status(200).json({ success: true, message: 'Parking deleted (fallback).' });
  } catch (error) {
    console.error('Error deleting parking:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete parking.' });
  }
};

/**
 * 6. POST /updateParking (ESP32 Sensor Hook)
 * Accepts HTTP POST request from ESP32 with slot availability state.
 * Emits real-time Socket.IO event 'parkingSlotUpdated' to all connected frontend clients.
 * Payload example: { parking_id: 1, slot_number: 2, is_occupied: true }
 */
const updateParkingFromESP32 = async (req, res) => {
  try {
    const { parking_id, slot_number, is_occupied } = req.body;

    if (parking_id === undefined || slot_number === undefined || is_occupied === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ESP32 payload. Required: parking_id, slot_number, is_occupied (boolean).',
      });
    }

    const pId = parseInt(parking_id, 10);
    const sNum = parseInt(slot_number, 10);
    const occupied = Boolean(is_occupied);

    let updatedParkingSummary = null;

    try {
      // Upsert slot state
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied, last_updated)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (parking_id, slot_number) 
         DO UPDATE SET is_occupied = $3, last_updated = CURRENT_TIMESTAMP`,
        [pId, sNum, occupied]
      );

      // Recalculate total available slots for this parking lot
      const countRes = await db.query(
        `SELECT COUNT(*) as available FROM parking_slots WHERE parking_id = $1 AND is_occupied = FALSE`,
        [pId]
      );
      const newAvailable = parseInt(countRes.rows[0].available, 10);

      const parkingUpdateRes = await db.query(
        `UPDATE parkings SET available_slots = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [newAvailable, pId]
      );

      if (parkingUpdateRes.rows.length > 0) {
        updatedParkingSummary = parkingUpdateRes.rows[0];
      }
    } catch (dbErr) {
      console.log('ℹ️ Processing ESP32 sensor update in fallback memory state.');
      const lot = fallbackParkings.find((p) => p.id === pId);
      if (lot) {
        let slot = lot.slots.find((s) => s.slot_number === sNum);
        if (!slot) {
          slot = { slot_number: sNum, is_occupied: occupied };
          lot.slots.push(slot);
        } else {
          slot.is_occupied = occupied;
        }

        const occupiedCount = lot.slots.filter((s) => s.is_occupied).length;
        lot.occupied_slots = occupiedCount;
        lot.available_slots = Math.max(0, lot.total_slots - occupiedCount);
        updatedParkingSummary = lot;
      }
    }

    // Prepare real-time broadcast payload for Socket.IO clients
    const updateEventPayload = {
      parking_id: pId,
      slot_number: sNum,
      is_occupied: occupied,
      updated_parking: updatedParkingSummary,
      timestamp: new Date(),
    };

    // Emit live WebSocket update event
    const io = req.app.get('io');
    if (io) {
      io.emit('parkingSlotUpdated', updateEventPayload);
      console.log(`📡 Broadcasted Socket.IO event 'parkingSlotUpdated' for Lot #${pId}, Slot #${sNum}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Parking slot status updated via ESP32 hook.',
      data: updateEventPayload,
    });
  } catch (error) {
    console.error('Error handling ESP32 update:', error);
    return res.status(500).json({ success: false, message: 'Failed to process ESP32 sensor update.' });
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
