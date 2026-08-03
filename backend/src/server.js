// ============================================================================
// MAIN NODE.JS / EXPRESS + SOCKET.IO SERVER ENTRYPOINT
// ============================================================================
// This file initializes the Express web server, configures CORS, mounts API routes,
// attaches Socket.IO for real-time WebSocket communication, and starts listening.
// ============================================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const parkingRoutes = require('./routes/parkingRoutes');
const authRoutes = require('./routes/authRoutes');
const initializeSocketHandlers = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO server with CORS options
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach Socket.IO instance to app so controllers can emit real-time events
app.set('io', io);

// Initialize Socket.IO connection handlers
initializeSocketHandlers(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'Smart Parking Backend Service',
  });
});

// Mount Routes (Mount both root-level endpoints and /api prefixed routes for flexibility)
app.use('/api/auth', authRoutes);

// Direct mapping for specified routes: GET /parkings, GET /parking/:id, POST /updateParking, etc.
app.use('/', parkingRoutes);
app.use('/api', parkingRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Start listening on configured PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 Smart Parking System Backend is running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
  console.log(`🔌 WebSockets: Ready for connections`);
  console.log(`========================================================`);
});
