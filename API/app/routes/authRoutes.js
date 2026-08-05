import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userService from '../services/userService.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
        timestamp: new Date().toISOString(),
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await userService.createUser(email, password, fullName);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      status: 'success',
      message: result.message,
      user: result.user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await userService.authenticateUser(email, password);

    if (!result.success) {
      return res.status(401).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await userService.getUserById(req.user.userId);

    if (!result.success) {
      return res.status(404).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      user: result.user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, avatarUrl } = req.body;

    const result = await userService.updateUserProfile(req.user.userId, {
      fullName,
      avatarUrl,
    });

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      message: result.message,
      user: result.user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/auth/preferences
 * Get user preferences
 */
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const result = await userService.getUserPreferences(req.user.userId);

    if (!result.success) {
      return res.status(404).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      preferences: result.preferences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/auth/preferences
 * Update user preferences
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { theme, timezone, language, notificationsEnabled } = req.body;

    const result = await userService.updateUserPreferences(req.user.userId, {
      theme,
      timezone,
      language,
      notificationsEnabled,
    });

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      message: result.message,
      preferences: result.preferences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
