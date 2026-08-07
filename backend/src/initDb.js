const db = require('./config/db');

async function initializeDatabase() {
  try {
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

    // Clean and reseed
    await db.query('DELETE FROM sensor_logs');
    await db.query('DELETE FROM reservations WHERE parking_id IS NOT NULL');
    await db.query('DELETE FROM parking_slots');
    await db.query('DELETE FROM parkings');

    console.log('📦 Seeding 2 parking locations near Trichy...');

    // Parking #1: IoT Connected (ESP32) — Lalgudi area, ~20km from Trichy center
    // Real coordinates: Lalgudi Bus Stand area
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (1, 'SRM Smart Parking', 'Lalgudi Main Road, Near Bus Stand', 'Lalgudi, Trichy', 10.8740, 78.8150, 4, 4)`
    );
    for (let i = 1; i <= 4; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES (1, $1, FALSE)`, [i]
      );
    }

    // Parking #2: Dummy — Perambalur area, ~50km from Trichy center
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (2, 'Highway Plaza Parking', 'NH45, Near Perambalur Bus Stand', 'Perambalur', 11.2350, 78.8800, 8, 6)`
    );
    for (let i = 1; i <= 8; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES (2, $1, $2)`, [i, i <= 2]
      );
    }

    await db.query(`SELECT setval('parkings_id_seq', (SELECT MAX(id) FROM parkings))`);

    console.log('✅ Seeded:');
    console.log('   1. SRM Smart Parking (IoT) — Lalgudi (~20km from Trichy)');
    console.log('   2. Highway Plaza Parking — Perambalur (~50km from Trichy)');

  } catch (error) {
    console.warn('⚠️ DB init warning:', error.message);
  }
}

module.exports = initializeDatabase;
