// ============================================================================
// DATABASE INITIALIZATION & SEED SCRIPT
// ============================================================================
// Cleans and seeds exactly 2 parking locations with real coordinates:
// Parking #1 = IoT Connected (ESP32), ~20km from user (Trichy area)
// Parking #2 = Dummy parking, ~50km from user
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

    // Clean ALL existing parkings and reseed with exactly 2
    console.log('🧹 Cleaning existing parking data...');
    await db.query('DELETE FROM sensor_logs');
    await db.query('DELETE FROM reservations WHERE parking_id IS NOT NULL');
    await db.query('DELETE FROM parking_slots');
    await db.query('DELETE FROM parkings');

    console.log('📦 Seeding 2 parking locations...');

    // Parking #1: IoT Connected (ESP32 sensor) — ~20km from Manachanallur
    // Location: Near Tiruchirappalli (Trichy) city center
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (1, 'SRM Smart Parking', 'Trichy Main Road, Near Central Bus Stand', 'Tiruchirappalli', 10.7905, 78.7047, 4, 4)`
    );

    // Create 4 virtual slots for parking #1
    for (let i = 1; i <= 4; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied)
         VALUES (1, $1, FALSE)`,
        [i]
      );
    }

    // Parking #2: Dummy parking — ~50km from Manachanallur
    // Location: West of Trichy, towards Karur direction
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (2, 'Highway Plaza Parking', 'NH44, Musiri Bypass Road', 'Musiri', 10.9530, 78.3450, 8, 6)`
    );

    // Create 8 slots for parking #2 (2 occupied by default)
    for (let i = 1; i <= 8; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied)
         VALUES (2, $1, $2)`,
        [i, i <= 2]  // slots 1-2 occupied, 3-8 free
      );
    }

    // Reset sequence
    await db.query(`SELECT setval('parkings_id_seq', (SELECT MAX(id) FROM parkings))`);

    console.log('✅ Seeded 2 parking locations:');
    console.log('   1. SRM Smart Parking (IoT) — Trichy (~20km)');
    console.log('   2. Highway Plaza Parking — Musiri (~50km)');

  } catch (error) {
    console.warn('⚠️ Database initialization warning:', error.message);
  }
}

module.exports = initializeDatabase;
