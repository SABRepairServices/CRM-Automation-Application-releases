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
    const { email, pin, fullName } = req.body;

    // Validation
    if (!email || !pin) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and PIN are required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        status: 'error',
        message: 'PIN must be exactly 6 digits',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await userService.createUser(email, pin, fullName);

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
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and PIN are required',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await userService.authenticateUser(email, pin);

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
 * POST /api/auth/forgot-pin
 * Emails a one-time reset code for a forgotten PIN. Always responds with
 * success (even for an unknown email) so this can't be used to check which
 * emails have accounts.
 */
router.post('/forgot-pin', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required',
        timestamp: new Date().toISOString(),
      });
    }

    await userService.requestPinReset(email);

    return res.status(200).json({
      status: 'success',
      message: 'If that email has an account, a reset code has been sent.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Forgot PIN error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/auth/reset-pin
 * Sets a new PIN using the code emailed by /forgot-pin.
 */
router.post('/reset-pin', async (req, res) => {
  try {
    const { email, otp, newPin } = req.body;

    if (!email || !otp || !newPin) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, code, and new PIN are required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({
        status: 'error',
        message: 'PIN must be exactly 6 digits',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await userService.resetPin(email, otp, newPin);

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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Reset PIN error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/auth/change-pin
 * Changes the PIN for the logged-in user (Settings page), requiring the
 * current PIN rather than an emailed code.
 */
router.put('/change-pin', authenticate, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({
        status: 'error',
        message: 'Current and new PIN are required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({
        status: 'error',
        message: 'PIN must be exactly 6 digits',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await userService.changePin(req.user.userId, currentPin, newPin);

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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Change PIN error:', error);
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
