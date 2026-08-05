import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import { listQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation, getQuotationStats } from '../services/quotationService.js';

const router = express.Router();

router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, status, job_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const quotations = await listQuotations(client_id, { status, job_id });
    res.json({ data: quotations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, job_id, items, discount_amount, vat_percent, valid_until, notes } = req.body;
    if (!client_id || !job_id) {
      return res.status(400).json({ error: 'client_id and job_id are required' });
    }

    const quotation = await createQuotation(client_id, { job_id, items, discount_amount, vat_percent, valid_until, notes });
    res.json({ data: quotation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const quotation = await getQuotation(client_id, req.params.id);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    res.json({ data: quotation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const quotation = await updateQuotation(client_id, req.params.id, req.body);
    res.json({ data: quotation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const quotation = await deleteQuotation(client_id, req.params.id);
    res.json({ data: quotation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/overview', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const stats = await getQuotationStats(client_id);
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
