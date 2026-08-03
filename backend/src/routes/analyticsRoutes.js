const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../controllers/analyticsController');

// GET /api/analytics/summary
router.get('/summary', getAnalyticsSummary);

module.exports = router;
