-- ============================================================================
-- SMART PARKING SYSTEM - DATABASE SCHEMA (PostgreSQL / Neon DB)
-- ============================================================================
-- Creates:
-- 1. users: Authentication credentials and roles (user, admin).
-- 2. parkings: Parking location details, coordinates, and slot counters.
-- 3. parking_slots: Real-time IR sensor slot states.
-- 4. reservations: User slot reservations with start/end time and QR pass tokens.
-- 5. sensor_logs: Historical telemetry log for analytics and sensor audits.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. PARKINGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parkings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    total_slots INT NOT NULL DEFAULT 10,
    available_slots INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. PARKING_SLOTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parking_slots (
    id SERIAL PRIMARY KEY,
    parking_id INT NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
    slot_number INT NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parking_id, slot_number)
);

-- ----------------------------------------------------------------------------
-- 4. RESERVATIONS TABLE (Stage 5 Feature)
-- Stores slot reservations made by users with QR pass code tokens.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    parking_id INT NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
    slot_number INT NOT NULL,
    reservation_token VARCHAR(100) UNIQUE NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. SENSOR_LOGS TABLE (Stage 5 Analytics)
-- Telemetry log recorded whenever an ESP32 sensor state changes.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_logs (
    id SERIAL PRIMARY KEY,
    parking_id INT NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
    slot_number INT NOT NULL,
    is_occupied BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_parkings_city ON parkings(city);
CREATE INDEX IF NOT EXISTS idx_slots_parking_id ON parking_slots(parking_id);
CREATE INDEX IF NOT EXISTS idx_reservations_parking ON reservations(parking_id);
CREATE INDEX IF NOT EXISTS idx_sensor_logs_parking ON sensor_logs(parking_id);

-- Initial seed data
INSERT INTO parkings (name, address, city, latitude, longitude, total_slots, available_slots)
VALUES 
    ('Central Tech Parking Hub', '123 Innovation Way, Tech District', 'San Francisco', 37.774929, -122.419416, 5, 3),
    ('Downtown Plaza Garage', '456 Market Street', 'San Francisco', 37.788500, -122.401500, 10, 7),
    ('Metro Station Parking', '789 Transit Blvd', 'San Jose', 37.338208, -121.886329, 8, 4)
ON CONFLICT DO NOTHING;
