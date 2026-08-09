import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import { listCalls, getCall, createCall, updateCall, deleteCall, getCallStats } from '../services/callService.js';

const router = express.Router();

router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, customer_id, job_id } = req.query;
    const calls = await listCalls(client_id, { customer_id, job_id });
    res.json({ data: calls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/overview', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    const stats = await getCallStats(client_id);
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    const call = await getCall(client_id, req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });
    res.json({ data: call });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    const call = await createCall(client_id, req.body);
    res.json({ data: call });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    const call = await updateCall(client_id, req.params.id, req.body);
    res.json({ data: call });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    await deleteCall(client_id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
