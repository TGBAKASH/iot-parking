// ============================================================================
// DATABASE INITIALIZATION & SEED SCRIPT
// ============================================================================
// Creates tables if they don't exist and seeds 2 test parking locations.
// Parking #1 = IoT Connected (ESP32 entry/exit counter)
// Parking #2 = Demo location
// ============================================================================

const db = require('./config/db');

async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS parkings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500),
        city VARCHAR(255),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        total_slots INTEGER DEFAULT 4,
        available_slots INTEGER DEFAULT 4,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS parking_slots (
        id SERIAL PRIMARY KEY,
        parking_id INTEGER REFERENCES parkings(id) ON DELETE CASCADE,
        slot_number INTEGER NOT NULL,
        is_occupied BOOLEAN DEFAULT FALSE,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(parking_id, slot_number)
      );

      CREATE TABLE IF NOT EXISTS sensor_logs (
        id SERIAL PRIMARY KEY,
        parking_id INTEGER,
        slot_number INTEGER,
        is_occupied BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        parking_id INTEGER REFERENCES parkings(id) ON DELETE CASCADE,
        slot_number INTEGER,
        vehicle_number VARCHAR(50),
        duration INTEGER DEFAULT 60,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);

    console.log('✅ Database tables verified.');

    // Check if parkings already exist
    const existing = await db.query('SELECT COUNT(*) FROM parkings');
    const count = parseInt(existing.rows[0].count, 10);

    if (count === 0) {
      console.log('📦 Seeding 2 test parking locations...');

      // Parking #1: IoT Connected (ESP32 sensors)
      await db.query(
        `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
         VALUES (1, 'Smart Parking Hub', 'Main Road, Block A', 'Chennai', 13.0827, 80.2707, 4, 4)
         ON CONFLICT (id) DO NOTHING`
      );

      // Create 4 virtual slots for parking #1
      for (let i = 1; i <= 4; i++) {
        await db.query(
          `INSERT INTO parking_slots (parking_id, slot_number, is_occupied)
           VALUES (1, $1, FALSE)
           ON CONFLICT (parking_id, slot_number) DO NOTHING`,
          [i]
        );
      }

      // Parking #2: Demo location
      await db.query(
        `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
         VALUES (2, 'City Mall Parking', 'Anna Nagar, 2nd Avenue', 'Chennai', 13.0878, 80.2785, 8, 8)
         ON CONFLICT (id) DO NOTHING`
      );

      // Create 8 slots for parking #2
      for (let i = 1; i <= 8; i++) {
        await db.query(
          `INSERT INTO parking_slots (parking_id, slot_number, is_occupied)
           VALUES (2, $1, FALSE)
           ON CONFLICT (parking_id, slot_number) DO NOTHING`,
          [i]
        );
      }

      // Reset sequence to avoid ID conflicts
      await db.query(`SELECT setval('parkings_id_seq', (SELECT MAX(id) FROM parkings))`);

      console.log('✅ Seeded 2 parking locations successfully.');
    } else {
      console.log(`ℹ️  ${count} parking location(s) already exist. Skipping seed.`);
    }
  } catch (error) {
    console.warn('⚠️ Database initialization warning:', error.message);
  }
}

module.exports = initializeDatabase;
