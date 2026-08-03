// ============================================================================
// AUTHENTICATION CONTROLLER (HARDCODED ADMIN EMAIL & SECURE REGISTRATION)
// ============================================================================
// Security Policies:
// - Public registration CANNOT choose admin role.
// - Hardcoded admin emails ('plumetestnet@gmail.com', etc.) are automatically assigned
//   the 'admin' role upon registration/login.
// - All other registrants are strictly assigned the 'user' role.
// ============================================================================

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

// Hardcoded Admin Email Addresses (Add any additional admin emails here)
const HARDCODED_ADMIN_EMAILS = [
  'plumetestnet@gmail.com',
  'dpwarriors3@gmail.com',
  'admin@example.com',
];

/**
 * Helper to check if an email belongs to the hardcoded admin list
 */
const isHardcodedAdmin = (email) => {
  if (!email) return false;
  return HARDCODED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

/**
 * 1. Register a new user
 * POST /api/auth/register
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Name, email address, and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!validator.isEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid email address format.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Password must be at least 6 characters long.',
      });
    }

    const sanitizedName = validator.escape(name.trim());

    // Check if user already exists in Neon DB
    const existingUserRes = await db.query('SELECT id, role FROM users WHERE email = $1', [cleanEmail]);
    if (existingUserRes.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Determine role strictly: Hardcoded Admin emails get 'admin', everyone else gets 'user'
    const userRole = isHardcodedAdmin(cleanEmail) ? 'admin' : 'user';

    // Hash password securely (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into Neon DB
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
 * 2. Login user or hardcoded admin
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

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Authentication Error: Invalid email address or password.',
      });
    }

    // Ensure hardcoded admin emails always have role = 'admin'
    let effectiveRole = user.role;
    if (isHardcodedAdmin(cleanEmail) && user.role !== 'admin') {
      effectiveRole = 'admin';
      await db.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [user.id]);
    }

    // Issue JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: effectiveRole, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: effectiveRole,
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
 * 3. Get current authenticated user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const userObj = result.rows[0];
    if (isHardcodedAdmin(userObj.email)) {
      userObj.role = 'admin';
    }

    return res.status(200).json({
      success: true,
      user: userObj,
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
