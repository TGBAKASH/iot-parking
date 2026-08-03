const express = require('express');
const router = express.Router();
const { createReservation, getReservations, cancelReservation } = require('../controllers/reservationController');

// POST /api/reservations/create
router.post('/create', createReservation);

// GET /api/reservations
router.get('/', getReservations);

// POST /api/reservations/cancel/:id
router.post('/cancel/:id', cancelReservation);

module.exports = router;
