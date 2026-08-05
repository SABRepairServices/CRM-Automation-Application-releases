import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import { listJobs, getJob, createJob, updateJob, deleteJob, getJobStats } from '../services/jobService.js';

const router = express.Router();

router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, status, technician_id, customer_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const jobs = await listJobs(client_id, { status, technician_id, customer_id });
    res.json({ data: jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, customer_id, appliance_type, brand, model, serial_number, reported_fault, scheduled_at } = req.body;
    if (!client_id || !customer_id || !appliance_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const job = await createJob(client_id, { customer_id, appliance_type, brand, model, serial_number, reported_fault, scheduled_at });
    res.json({ data: job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const job = await getJob(client_id, req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    res.json({ data: job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const job = await updateJob(client_id, req.params.id, req.body);
    res.json({ data: job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const job = await deleteJob(client_id, req.params.id);
    res.json({ data: job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/overview', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const stats = await getJobStats(client_id);
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
