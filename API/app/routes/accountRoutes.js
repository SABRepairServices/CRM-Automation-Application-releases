import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as socialAccountService from '../services/socialAccountService.js';

const router = express.Router();

/**
 * GET /api/accounts
 * Get user's social accounts
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await socialAccountService.getUserSocialAccounts(req.user.userId);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      accounts: result.accounts,
      count: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/accounts
 * Add new social account
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const accountData = req.body;

    const result = await socialAccountService.addSocialAccount(req.user.userId, accountData);

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
      account: result.account,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Add account error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/accounts/:accountId
 * Get specific account
 */
router.get('/:accountId', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;

    const result = await socialAccountService.getSocialAccount(accountId, req.user.userId);

    if (!result.success) {
      return res.status(404).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      account: result.account,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get account error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/accounts/:accountId
 * Update account
 */
router.put('/:accountId', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const updates = req.body;

    const result = await socialAccountService.updateSocialAccount(accountId, req.user.userId, updates);

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
      account: result.account,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update account error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/accounts/:accountId
 * Disconnect account
 */
router.delete('/:accountId', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;

    const result = await socialAccountService.disconnectSocialAccount(accountId, req.user.userId);

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
    console.error('Delete account error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
