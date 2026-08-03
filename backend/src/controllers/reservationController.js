// ============================================================================
// RESERVATION CONTROLLER (SLOT BOOKING & DIGITAL QR PASS GENERATION)
// ============================================================================
// Handles user slot reservations, duration booking, QR pass tokens,
// and cancellation.
// ============================================================================

const db = require('../config/db');
const { v4: uuidv4 } = require('crypto');

/**
 * Generate a clean digital QR pass code string: e.g. "PARK-98A2-4F1B"
 */
const generatePassCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'PARK-';
  for (let i = 0; i < 4; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
  token += '-';
  for (let i = 0; i < 4; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
};

/**
 * 1. POST /api/reservations/create
 * Reserves a slot for a user for a given duration (in hours).
 */
const createReservation = async (req, res) => {
  try {
    const { parking_id, slot_number, user_name, vehicle_number, duration_hours } = req.body;

    if (!parking_id || !slot_number || !user_name || !vehicle_number) {
      return res.status(400).json({
        success: false,
        message: 'Missing required reservation fields: parking_id, slot_number, user_name, vehicle_number.',
      });
    }

    const pId = parseInt(parking_id, 10);
    const sNum = parseInt(slot_number, 10);
    const hours = parseInt(duration_hours || 1, 10);

    // Verify parking lot exists
    const parkingRes = await db.query('SELECT name, total_slots, available_slots FROM parkings WHERE id = $1', [pId]);
    if (parkingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking lot not found.' });
    }

    // Check if slot is already occupied
    const slotRes = await db.query(
      'SELECT is_occupied FROM parking_slots WHERE parking_id = $1 AND slot_number = $2',
      [pId, sNum]
    );

    if (slotRes.rows.length > 0 && slotRes.rows[0].is_occupied) {
      return res.status(400).json({
        success: false,
        message: `Slot #${sNum} is currently occupied by another vehicle.`,
      });
    }

    // Generate Pass Code Token
    const passCodeToken = generatePassCode();

    // Calculate End Time
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

    const userId = req.user ? req.user.id : null;

    // Insert reservation record into Neon DB
    const insertRes = await db.query(
      `INSERT INTO reservations 
         (user_id, parking_id, slot_number, reservation_token, user_name, vehicle_number, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING *`,
      [userId, pId, sNum, passCodeToken, user_name.trim(), vehicle_number.trim(), startTime, endTime]
    );

    const reservation = insertRes.rows[0];
    reservation.parking_name = parkingRes.rows[0].name;

    // Broadcast reservation event via WebSockets
    const io = req.app.get('io');
    if (io) {
      io.emit('slotReserved', {
        parking_id: pId,
        slot_number: sNum,
        reservation,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Slot reserved successfully! Digital QR Pass generated.',
      data: reservation,
    });
  } catch (error) {
    console.error('Error in createReservation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create slot reservation in database.',
    });
  }
};

/**
 * 2. GET /api/reservations
 * Get active reservations list
 */
const getReservations = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, p.name AS parking_name, p.address AS parking_address
       FROM reservations r
       JOIN parkings p ON r.parking_id = p.id
       ORDER BY r.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error in getReservations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch reservations.' });
  }
};

/**
 * 3. POST /api/reservations/cancel/:id
 * Cancel an active reservation
 */
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const resId = parseInt(id, 10);

    const updateRes = await db.query(
      `UPDATE reservations SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [resId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully.',
      data: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error in cancelReservation:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel reservation.' });
  }
};

module.exports = {
  createReservation,
  getReservations,
  cancelReservation,
};
