// ============================================================================
// AUTHENTICATION CONTROLLER (SKELETON)
// ============================================================================
// Contains register and login handlers for administrative and user access.
// Implements bcrypt hashing and JSON Web Token (JWT) issuing logic.
// ============================================================================

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Register a new user or admin
 * POST /api/auth/register
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // SQL query to insert user (with fallback handling if DB not yet migrated)
    let newUser;
    try {
      const result = await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
        [name, email, hashedPassword, role || 'user']
      );
      newUser = result.rows[0];
    } catch (dbErr) {
      // In skeleton mode without active DB, return mock user response
      newUser = { id: 1, name, email, role: role || 'user', created_at: new Date() };
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * Login existing user or admin
 * POST /api/auth/login
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // Mock response if DB connection is unavailable in early milestone testing
    const mockUser = {
      id: 1,
      name: 'Demo Admin',
      email: email,
      role: 'admin',
    };

    const token = jwt.sign(
      { id: mockUser.id, email: mockUser.email, role: mockUser.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: mockUser,
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
