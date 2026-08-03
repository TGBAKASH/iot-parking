// ============================================================================
// MAIN NODE.JS / EXPRESS + SOCKET.IO SERVER ENTRYPOINT (SINGLE SERVICE READY)
// ============================================================================
// Configures Express web server, CORS, API routes, Socket.IO WebSockets,
// and serves static frontend bundle (frontend/dist) for single-service deployment.
// ============================================================================

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const parkingRoutes = require('./routes/parkingRoutes');
const authRoutes = require('./routes/authRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
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

// Attach Socket.IO instance to app for controller broadcasts
app.set('io', io);

// Initialize Socket.IO event handlers
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
    database: 'Neon PostgreSQL Connected',
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/', parkingRoutes);
app.use('/api', parkingRoutes);

// ----------------------------------------------------------------------------
// SINGLE SERVICE MONOREPO SUPPORT: SERVE FRONTEND STATIC BUILD ON PRODUCTION
// ----------------------------------------------------------------------------
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');

if (fs.existsSync(frontendDistPath)) {
  console.log('📦 Serving compiled frontend static files from:', frontendDistPath);
  app.use(express.static(frontendDistPath));

  // Wildcard handler for SPA React Router
  app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/parkings') && !req.originalUrl.startsWith('/parking') && !req.originalUrl.startsWith('/updateParking')) {
      return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
}

// Catch-all 404 handler for unmapped API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 Smart Parking System Server is running on port ${PORT}`);
  console.log(`🌐 Application URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO WebSockets: Ready for connections`);
  console.log(`========================================================`);
});
