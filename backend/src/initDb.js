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

    // Clean and reseed all parking lots
    await db.query('DELETE FROM sensor_logs');
    await db.query('DELETE FROM reservations WHERE parking_id IS NOT NULL');
    await db.query('DELETE FROM parking_slots');
    await db.query('DELETE FROM parkings');

    console.log('📦 Seeding 6 parking locations across 6 different districts...');

    // 1. Tiruchirappalli District (IoT Connected with ESP32)
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (1, 'SRM Smart Parking', 'Lalgudi Main Road, Near Bus Stand', 'Tiruchirappalli', 10.8740, 78.8150, 4, 4)`
    );
    for (let i = 1; i <= 4; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES (1, $1, FALSE)`, [i]
      );
    }

    // 2. Perambalur District (Dummy 1)
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (2, 'Highway Plaza Parking', 'NH45, Near Perambalur Bus Stand', 'Perambalur', 11.2350, 78.8800, 8, 6)`
    );
    for (let i = 1; i <= 8; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES (2, $1, $2)`, [i, i <= 2]
      );
    }

    // 3. Madurai District (Dummy 2)
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (3, 'Meenakshi Temple Parking Hub', 'West Veli Street, Near Temple Gate', 'Madurai', 9.9252, 78.1198, 12, 7)`
    );
    for (let i = 1; i <= 12; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES (3, $1, $2)`, [i, i <= 5]
      );
    }

    // 4. Thanjavur District (Dummy 3)
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (4, 'Brihadeeswara Heritage Parking', 'Membalam Road, Old Bus Stand', 'Thanjavur', 10.7828, 79.1318, 10, 6)`
    );
    for (let i = 1; i <= 10; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES (4, $1, $2)`, [i, i <= 4]
      );
    }

    // 5. Karur District (Dummy 4)
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (5, 'Textile Valley Central Parking', 'Kovai Road, Near Collector Office', 'Karur', 10.9601, 78.0766, 6, 4)`
    );
    for (let i = 1; i <= 6; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES (5, $1, $2)`, [i, i <= 2]
      );
    }

    // 6. Dindigul District (Dummy 5)
    await db.query(
      `INSERT INTO parkings (id, name, address, city, latitude, longitude, total_slots, available_slots)
       VALUES (6, 'Fort Hill Parking Plaza', 'Palani Road, Near Bus Terminus', 'Dindigul', 10.3673, 77.9803, 8, 5)`
    );
    for (let i = 1; i <= 8; i++) {
      await db.query(
        `INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES (6, $1, $2)`, [i, i <= 3]
      );
    }

    await db.query(`SELECT setval('parkings_id_seq', (SELECT MAX(id) FROM parkings))`);

    console.log('✅ Seeded 6 parking locations:');
    console.log('   1. SRM Smart Parking (IoT) — Tiruchirappalli (4 slots)');
    console.log('   2. Highway Plaza Parking — Perambalur (8 slots)');
    console.log('   3. Meenakshi Temple Parking Hub — Madurai (12 slots)');
    console.log('   4. Brihadeeswara Heritage Parking — Thanjavur (10 slots)');
    console.log('   5. Textile Valley Central Parking — Karur (6 slots)');
    console.log('   6. Fort Hill Parking Plaza — Dindigul (8 slots)');

  } catch (error) {
    console.warn('⚠️ DB init warning:', error.message);
  }
}

module.exports = initializeDatabase;
