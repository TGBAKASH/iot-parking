// ============================================================================
// ANALYTICS & TELEMETRY CONTROLLER
// ============================================================================
// Queries system-wide metrics, peak occupancy statistics, and recent sensor
// telemetry logs directly from Neon PostgreSQL.
// ============================================================================

const db = require('../config/db');

/**
 * GET /api/analytics/summary
 * Returns system dashboard metrics & sensor telemetry history
 */
const getAnalyticsSummary = async (req, res) => {
  try {
    // 1. Total parking locations & total capacity
    const parkingsStatsRes = await db.query(
      `SELECT 
         COUNT(*) AS total_locations,
         COALESCE(SUM(total_slots), 0) AS total_capacity,
         COALESCE(SUM(available_slots), 0) AS total_available,
         COALESCE(SUM(total_slots - available_slots), 0) AS total_occupied
       FROM parkings`
    );

    const stats = parkingsStatsRes.rows[0];
    const totalCapacity = parseInt(stats.total_capacity, 10);
    const totalOccupied = parseInt(stats.total_occupied, 10);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    // 2. Total active reservations
    const resCountRes = await db.query(
      `SELECT COUNT(*) AS active_reservations FROM reservations WHERE status = 'active'`
    );
    const activeReservations = parseInt(resCountRes.rows[0].active_reservations, 10);

    // 3. Recent sensor telemetry logs
    const sensorLogsRes = await db.query(
      `SELECT sl.id, sl.parking_id, sl.slot_number, sl.is_occupied, sl.created_at, p.name AS parking_name
       FROM sensor_logs sl
       JOIN parkings p ON sl.parking_id = p.id
       ORDER BY sl.created_at DESC
       LIMIT 10`
    );

    return res.status(200).json({
      success: true,
      data: {
        totalLocations: parseInt(stats.total_locations, 10),
        totalCapacity,
        totalAvailable: parseInt(stats.total_available, 10),
        totalOccupied,
        occupancyRate,
        activeReservations,
        recentTelemetryLogs: sensorLogsRes.rows,
      },
    });
  } catch (error) {
    console.error('Error in getAnalyticsSummary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics metrics.',
    });
  }
};

module.exports = {
  getAnalyticsSummary,
};
