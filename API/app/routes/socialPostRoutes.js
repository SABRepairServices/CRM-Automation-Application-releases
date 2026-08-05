import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import * as socialPostService from '../services/socialPostService.js';

const router = express.Router();

router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const posts = await socialPostService.listPosts(clientId, {
      accountId: req.query.accountId,
      status: req.query.status
    });
    res.json({ data: posts, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const post = await socialPostService.getPost(clientId, req.params.id);
    if (!post) return res.status(404).json({ data: null, error: 'Post not found' });

    res.json({ data: post, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const post = await socialPostService.createPost(clientId, req.body);
    res.status(201).json({ data: post, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const post = await socialPostService.updatePost(clientId, req.params.id, req.body);
    res.json({ data: post, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const post = await socialPostService.deletePost(clientId, req.params.id);
    res.json({ data: post, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post('/:id/publish', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const post = await socialPostService.publishPost(clientId, req.params.id);
    res.json({ data: post, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post('/:id/schedule', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const post = await socialPostService.schedulePost(clientId, req.params.id, req.body.scheduledAt);
    res.json({ data: post, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.get('/stats/overview', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const stats = await socialPostService.getPostStats(clientId);
    res.json({ data: stats, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
