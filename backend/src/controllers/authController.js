// ============================================================================
// AUTHENTICATION CONTROLLER (FULL NEON POSTGRESQL INTEGRATION)
// ============================================================================
// Implements complete user registration, authentication, and profile lookup
// querying the Neon PostgreSQL 'users' table directly.
// ============================================================================

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

/**
 * 1. Register a new user or admin
 * POST /api/auth/register
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists in Neon DB
    const existingUserRes = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingUserRes.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Hash password securely using bcrypt (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRole = role && ['user', 'admin'].includes(role) ? role : 'user';

    // Insert user into Neon PostgreSQL database
    const insertResult = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name.trim(), cleanEmail, passwordHash, userRole]
    );

    const newUser = insertResult.rows[0];

    // Issue JWT Token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User account registered successfully.',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during user registration.',
    });
  }
};

/**
 * 2. Login existing user or admin
 * POST /api/auth/login
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query Neon PostgreSQL database for user credentials
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const user = userRes.rows[0];

    // Verify password against stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    // Issue JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userProfile,
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during login.',
    });
  }
};

/**
 * 3. Get profile of current logged in user
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
