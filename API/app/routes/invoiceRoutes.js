import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import { listInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, getInvoiceStats } from '../services/invoiceService.js';

const router = express.Router();

router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, status, job_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const invoices = await listInvoices(client_id, { status, job_id });
    res.json({ data: invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, customer_id, contract_id, issue_date, due_date, job_amounts, notes } = req.body;
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const invoice = await createInvoice(client_id, { customer_id, contract_id, issue_date, due_date, job_amounts, notes });
    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const invoice = await getInvoice(client_id, req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const invoice = await updateInvoice(client_id, req.params.id, req.body);
    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const invoice = await deleteInvoice(client_id, req.params.id);
    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/overview', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const stats = await getInvoiceStats(client_id);
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
