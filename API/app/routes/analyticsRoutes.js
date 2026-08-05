import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as analyticsService from '../services/analyticsService.js';

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Get dashboard metrics
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const result = await analyticsService.getDashboardMetrics(req.user.userId);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      metrics: result.metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/analytics/accounts/:accountId
 * Get analytics for specific account
 */
router.get('/accounts/:accountId', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'startDate and endDate are required',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await analyticsService.getAccountAnalytics(
      accountId,
      req.user.userId,
      startDate,
      endDate
    );

    if (!result.success) {
      return res.status(404).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      analytics: result.analytics,
      count: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get account analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/analytics/top-posts
 * Get top performing posts
 */
router.get('/top-posts', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await analyticsService.getTopPerformingPosts(
      req.user.userId,
      parseInt(limit)
    );

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      posts: result.posts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get top posts error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/analytics/record
 * Record daily analytics
 */
router.post('/record', authenticate, async (req, res) => {
  try {
    const { accountId, analyticsData } = req.body;

    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'accountId is required',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await analyticsService.recordDailyAnalytics(accountId, analyticsData);

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
      analytics: result.analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Record analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
