import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import {
  listInspectionReports,
  getInspectionReport,
  createInspectionReport,
  updateInspectionReport,
  deleteInspectionReport,
} from '../services/inspectionService.js';
import { sendInspectionManually } from '../services/documentSendService.js';

const router = express.Router();

router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, job_id } = req.query;
    const reports = await listInspectionReports(client_id, { job_id });
    res.json({ data: reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, job_id } = req.body;
    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    const report = await createInspectionReport(client_id, req.body);
    res.json({ data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    const report = await getInspectionReport(client_id, req.params.id);
    if (!report) return res.status(404).json({ error: 'Inspection report not found' });
    res.json({ data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    const report = await updateInspectionReport(client_id, req.params.id, req.body);
    res.json({ data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/send', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const result = await sendInspectionManually(client_id, req.params.id);
    if (result?.error) return res.status(400).json({ error: result.error });

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    await deleteInspectionReport(client_id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
