// ============================================================================
// AUTHENTICATION CONTROLLER (DEEP SECURITY AUDITED & SANITIZED)
// ============================================================================
// Features:
// - Email format validation (validator.isEmail)
// - Minimum password length enforcement (>= 6 chars)
// - String escaping & sanitization to prevent XSS/injection attacks
// - Secure error handling with zero stack trace leakage
// ============================================================================

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

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
        message: 'Validation Error: Name, email address, and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validate email format
    if (!validator.isEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid email address format.',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Password must be at least 6 characters long.',
      });
    }

    // Sanitize user name to prevent XSS
    const sanitizedName = validator.escape(name.trim());

    // Check if user already exists
    const existingUserRes = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingUserRes.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Hash password securely (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRole = role && ['user', 'admin'].includes(role) ? role : 'user';

    // Insert user record into Neon DB
    const insertResult = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [sanitizedName, cleanEmail, passwordHash, userRole]
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
    console.error('Secure Log - registerUser Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during registration.',
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
        message: 'Validation Error: Please provide both email address and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!validator.isEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid email address format.',
      });
    }

    // Query user credentials from Neon DB
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Authentication Error: Invalid email address or password.',
      });
    }

    const user = userRes.rows[0];

    // Verify password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Authentication Error: Invalid email address or password.',
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
    console.error('Secure Log - loginUser Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during authentication.',
    });
  }
};

/**
 * 3. Get profile of current authenticated user
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Secure Log - getCurrentUser Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
