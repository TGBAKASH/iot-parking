// ============================================================================
// SOCKET.IO REAL-TIME EVENT HANDLER
// ============================================================================
// Manages incoming WebSocket client connections, disconnects, and channel joins.
// ============================================================================

const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 New WebSocket client connected! Socket ID: ${socket.id}`);

    // Client joins a specific parking lot room to listen for target updates
    socket.on('joinParkingRoom', (parkingId) => {
      socket.join(`parking_${parkingId}`);
      console.log(`📌 Socket ${socket.id} joined room: parking_${parkingId}`);
    });

    // Handle client disconnects
    socket.on('disconnect', () => {
      console.log(`❌ WebSocket client disconnected. Socket ID: ${socket.id}`);
    });
  });
};

module.exports = initializeSocketHandlers;
