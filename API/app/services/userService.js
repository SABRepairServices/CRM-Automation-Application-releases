import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from './database.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { sendTextEmail } from './emailService.js';

/**
 * Create new user account
 */
export const createUser = async (email, password, fullName) => {
  try {
    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userId = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, password_hash, full_name, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, full_name, status, created_at`,
      [userId, email, passwordHash, fullName || '', 'active']
    );

    // Create user preferences
    await query(
      `INSERT INTO user_preferences (id, user_id, theme, timezone, language, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [uuidv4(), userId, 'light', 'UTC', 'en']
    );

    return {
      success: true,
      user: result.rows[0],
      message: 'User created successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Authenticate user (login)
 */
export const authenticateUser = async (email, password) => {
  try {
    const result = await query(
      `SELECT id, email, password_hash, full_name, status, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or PIN');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or PIN');
    }

    if (user.status !== 'active') {
      throw new Error('Account is inactive');
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const accessToken = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        status: user.status,
      },
      accessToken,
      refreshToken,
      message: 'Authentication successful',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, avatar_url, role, status, created_at, updated_at, last_login
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user: result.rows[0],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { fullName, avatarUrl } = updates;

    const result = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           avatar_url = COALESCE($2, avatar_url),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, full_name, avatar_url, role, status, updated_at`,
      [fullName || null, avatarUrl || null, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user: result.rows[0],
      message: 'Profile updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (userId) => {
  try {
    const result = await query(
      `SELECT id, user_id, theme, timezone, language, notifications_enabled,
              email_notifications, push_notifications, created_at, updated_at
       FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User preferences not found');
    }

    return {
      success: true,
      preferences: result.rows[0],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (userId, updates) => {
  try {
    const { theme, timezone, language, notificationsEnabled } = updates;

    const result = await query(
      `UPDATE user_preferences
       SET theme = COALESCE($1, theme),
           timezone = COALESCE($2, timezone),
           language = COALESCE($3, language),
           notifications_enabled = COALESCE($4, notifications_enabled),
           updated_at = NOW()
       WHERE user_id = $5
       RETURNING *`,
      [theme || null, timezone || null, language || null, notificationsEnabled, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User preferences not found');
    }

    return {
      success: true,
      preferences: result.rows[0],
      message: 'Preferences updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Starts the "forgot PIN" flow: emails a 6-digit code valid for 10 minutes.
 * Always returns success even for an unknown email, so the endpoint can't
 * be used to enumerate registered accounts.
 */
export const requestPinReset = async (email) => {
  const result = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    return { success: true };
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await query('UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3', [
    otp,
    expiresAt,
    result.rows[0].id,
  ]);

  await sendTextEmail({
    to: email,
    subject: 'Your PIN reset code',
    text: `Your PIN reset code is ${otp}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  });

  return { success: true };
};

/**
 * Completes the "forgot PIN" flow: verifies the emailed code and sets a
 * new PIN. The code is only cleared on success, so a wrong attempt can be
 * retried until it expires.
 */
export const resetPin = async (email, otp, newPin) => {
  try {
    const result = await query('SELECT id, otp_code, otp_expires_at FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new Error('Invalid or expired code');
    }

    const user = result.rows[0];
    const isValidCode =
      user.otp_code &&
      user.otp_code === otp &&
      user.otp_expires_at &&
      new Date(user.otp_expires_at) > new Date();

    if (!isValidCode) {
      throw new Error('Invalid or expired code');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPin, salt);

    await query(
      `UPDATE users SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL, updated_at = NOW() WHERE id = $2`,
      [passwordHash, user.id]
    );

    return { success: true, message: 'PIN reset successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Changes the PIN for an already-authenticated user (Settings page),
 * requiring the current PIN rather than an emailed code.
 */
export const changePin = async (userId, currentPin, newPin) => {
  try {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(currentPin, result.rows[0].password_hash);
    if (!isValid) {
      throw new Error('Current PIN is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPin, salt);

    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);

    return { success: true, message: 'PIN changed successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export default {
  createUser,
  authenticateUser,
  getUserById,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  requestPinReset,
  resetPin,
  changePin,
};
