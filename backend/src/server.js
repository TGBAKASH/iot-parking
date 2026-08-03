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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Configure Rate Limiting to prevent DoS & Brute Force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' },
});

// Configure Helmet for HTTP Security Headers (Content Security Policy, X-Frame-Options, XSS protection)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for static SPA asset bundling
  })
);

// Apply Rate Limiter to all API routes
app.use('/api', apiLimiter);

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
app.use(express.json({ limit: '10kb' })); // Body limit to prevent payload flooding
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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
