import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as postService from '../services/postService.js';

const router = express.Router();

/**
 * GET /api/posts
 * Get user's posts
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0, sortBy = 'created_at' } = req.query;

    const result = await postService.getUserPosts(req.user.userId, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
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
      posts: result.posts,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/posts
 * Create new post
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const postData = req.body;

    const result = await postService.createPost(req.user.userId, postData);

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
      post: result.post,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/posts/:postId
 * Get single post
 */
router.get('/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await postService.getPost(postId, req.user.userId);

    if (!result.success) {
      return res.status(404).json({
        status: 'error',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'success',
      post: result.post,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get post error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/posts/:postId
 * Update post
 */
router.put('/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const updates = req.body;

    const result = await postService.updatePost(postId, req.user.userId, updates);

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
      post: result.post,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update post error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/posts/:postId
 * Delete post
 */
router.delete('/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await postService.deletePost(postId, req.user.userId);

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
    console.error('Delete post error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/posts/:postId/schedule
 * Schedule post
 */
router.post('/:postId/schedule', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { scheduledAt, platforms } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        status: 'error',
        message: 'scheduledAt is required',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await postService.schedulePost(postId, req.user.userId, scheduledAt, platforms || []);

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
      post: result.post,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Schedule post error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/posts/scheduled
 * Get scheduled posts
 */
router.get('/scheduled/list', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await postService.getScheduledPosts(req.user.userId, parseInt(limit));

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
    console.error('Get scheduled posts error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
