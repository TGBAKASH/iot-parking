// ============================================================================
// AUTHENTICATION CONTROLLER (CLEAN PRODUCTION AUTH & PASSWORD UPDATE LOGIC)
// ============================================================================
// Features:
// - Email format validation (validator.isEmail)
// - Minimum password length enforcement (>= 6 chars)
// - Hardcoded Admin Email ('plumetestnet@gmail.com'):
//   Registering or logging in with hardcoded admin email automatically sets/updates
//   their password hash and issues an Admin JWT token!
// ============================================================================

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

// Hardcoded Admin Email Addresses
const HARDCODED_ADMIN_EMAILS = [
  'plumetestnet@gmail.com',
  'dpwarriors3@gmail.com',
];

/**
 * Helper to check if an email belongs to the hardcoded admin list
 */
const isHardcodedAdmin = (email) => {
  if (!email) return false;
  return HARDCODED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

/**
 * 1. Register a new user or set/update password for hardcoded admin
 * POST /api/auth/register
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!validator.isEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const sanitizedName = validator.escape((name || cleanEmail.split('@')[0]).trim());
    const isAdmin = isHardcodedAdmin(cleanEmail);
    const userRole = isAdmin ? 'admin' : 'user';

    // Hash password securely (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if user already exists in Neon DB
    const existingUserRes = await db.query('SELECT id, email, role FROM users WHERE email = $1', [cleanEmail]);

    let userRecord;

    if (existingUserRes.rows.length > 0) {
      // If hardcoded admin email exists, update their password hash to the new password provided
      if (isAdmin) {
        const updateRes = await db.query(
          `UPDATE users 
           SET password_hash = $1, name = $2, role = 'admin' 
           WHERE email = $3 
           RETURNING id, name, email, role, created_at`,
          [passwordHash, sanitizedName, cleanEmail]
        );
        userRecord = updateRes.rows[0];
      } else {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.',
        });
      }
    } else {
      // Insert new user into Neon DB
      const insertResult = await db.query(
        `INSERT INTO users (name, email, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, name, email, role, created_at`,
        [sanitizedName, cleanEmail, passwordHash, userRole]
      );
      userRecord = insertResult.rows[0];
    }

    // Issue JWT Token
    const token = jwt.sign(
      { id: userRecord.id, email: userRecord.email, role: userRecord.role, name: userRecord.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: isAdmin ? 'Admin account credentials updated and signed in.' : 'User registered successfully.',
      token,
      user: userRecord,
    });
  } catch (error) {
    console.error('Secure Log - registerUser Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process account registration.',
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
        message: 'Please provide both email address and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!validator.isEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.',
      });
    }

    // Query user from Neon DB
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);

    // If account doesn't exist yet and it's a hardcoded admin email, auto-create account with provided password
    if (userRes.rows.length === 0) {
      if (isHardcodedAdmin(cleanEmail)) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const sanitizedName = cleanEmail.split('@')[0];

        const insertRes = await db.query(
          `INSERT INTO users (name, email, password_hash, role) 
           VALUES ($1, $2, $3, 'admin') 
           RETURNING id, name, email, role, created_at`,
          [sanitizedName, cleanEmail, passwordHash]
        );

        const newAdmin = insertRes.rows[0];
        const token = jwt.sign(
          { id: newAdmin.id, email: newAdmin.email, role: 'admin', name: newAdmin.name },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({
          success: true,
          message: 'Admin account created and logged in.',
          token,
          user: newAdmin,
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Account not found. Please click "Register" to create an account.',
      });
    }

    const user = userRes.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // If hardcoded admin email, update password to new password typed by admin
      if (isHardcodedAdmin(cleanEmail)) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        await db.query(`UPDATE users SET password_hash = $1, role = 'admin' WHERE id = $2`, [passwordHash, user.id]);

        user.role = 'admin';
        const token = jwt.sign(
          { id: user.id, email: user.email, role: 'admin', name: user.name },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({
          success: true,
          message: 'Admin password updated and logged in successfully.',
          token,
          user: { id: user.id, name: user.name, email: user.email, role: 'admin' },
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    const userRole = isHardcodedAdmin(cleanEmail) ? 'admin' : user.role;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: userRole, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Secure Log - loginUser Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate user.',
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
