-- ============================================================================
-- SMART PARKING SYSTEM - DATABASE SCHEMA (PostgreSQL)
-- ============================================================================
-- This SQL script creates the database structure required for the Smart Parking System.
-- It creates three main tables:
-- 1. users: Stores admin and user authentication details.
-- 2. parkings: Stores parking location details, total capacity, and geographic coordinates.
-- 3. parking_slots: Stores real-time IR sensor slot states for each parking lot.
-- ============================================================================

-- Drop tables if they already exist (useful during resetting database)
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS parkings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores user credentials for dashboard access and administrative actions.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. PARKINGS TABLE
-- Stores parking lot locations, geographic coordinates for Google Maps, and slot counters.
-- ----------------------------------------------------------------------------
CREATE TABLE parkings (
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
-- Represents individual slots inside a parking lot. Updated by ESP32 sensors.
-- ----------------------------------------------------------------------------
CREATE TABLE parking_slots (
    id SERIAL PRIMARY KEY,
    parking_id INT NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
    slot_number INT NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parking_id, slot_number)
);

-- Index for fast lookup by location and parking ID
CREATE INDEX idx_parkings_city ON parkings(city);
CREATE INDEX idx_slots_parking_id ON parking_slots(parking_id);

-- ----------------------------------------------------------------------------
-- SAMPLE INITIAL DATA FOR TESTING (Milestone 1/2)
-- ----------------------------------------------------------------------------
INSERT INTO parkings (name, address, city, latitude, longitude, total_slots, available_slots)
VALUES 
    ('Central Tech Parking Hub', '123 Innovation Way, Tech District', 'San Francisco', 37.774929, -122.419416, 5, 3),
    ('Downtown Plaza Garage', '456 Market Street', 'San Francisco', 37.788500, -122.401500, 10, 7),
    ('Metro Station Parking', '789 Transit Blvd', 'San Jose', 37.338208, -121.886329, 8, 4);

-- Insert slots for Central Tech Parking Hub (ID 1)
INSERT INTO parking_slots (parking_id, slot_number, is_occupied) VALUES
    (1, 1, FALSE),
    (1, 2, TRUE),
    (1, 3, FALSE),
    (1, 4, TRUE),
    (1, 5, FALSE);
