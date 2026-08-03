// ============================================================================
// DATABASE CONFIGURATION MODULE (PostgreSQL)
// ============================================================================
// This file initializes a PostgreSQL connection pool using the 'pg' library.
// Using a connection pool ensures efficient reuse of database connections for
// high performance under frequent updates (like real-time ESP32 sensor posts).
// ============================================================================

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create PostgreSQL Connection Pool configuration
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'smart_parking_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool(poolConfig);

// Test database connection on initialization
pool.connect((err, client, release) => {
  if (err) {
    console.warn('⚠️ PostgreSQL database connection failed or not running locally:', err.message);
    console.warn('ℹ️ Backend will still run in fallback/skeleton mode until database is connected.');
  } else {
    console.log('✅ PostgreSQL database connected successfully.');
    release();
  }
});

// Helper query function for convenience across controllers
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
