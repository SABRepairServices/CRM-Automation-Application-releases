import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import {
  listAvailableJobs,
  listMonthlyInvoices,
  getMonthlyInvoice,
  createMonthlyInvoice,
  updateMonthlyInvoice,
  deleteMonthlyInvoice,
} from '../services/monthlyInvoiceService.js';
import { sendMonthlyInvoiceManually } from '../services/documentSendService.js';

const router = express.Router();

// Must be declared before '/:id' so "available-jobs" isn't captured as an id.
router.get('/available-jobs', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, contract_id, customer_id, month, year } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });
    if (!month || !year) return res.status(400).json({ error: 'month and year are required' });

    const jobs = await listAvailableJobs(client_id, { contract_id, customer_id, month: Number(month), year: Number(year) });
    res.json({ data: jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, status } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const invoices = await listMonthlyInvoices(client_id, { status });
    res.json({ data: invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, ...data } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });
    if (!data.customer_id && !data.contract_id) {
      return res.status(400).json({ error: 'customer_id or contract_id is required' });
    }
    if (!data.job_amounts?.length) {
      return res.status(400).json({ error: 'At least one job must be selected' });
    }

    const invoice = await createMonthlyInvoice(client_id, data);
    res.json({ data: invoice });
  } catch (err) {
    // A job already billed on another monthly invoice trips the UNIQUE
    // constraint on monthly_invoice_jobs.job_id — surface that as a real
    // message instead of a raw Postgres error.
    if (err.code === '23505') {
      return res.status(409).json({ error: 'One or more of those jobs is already on another monthly invoice' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const invoice = await getMonthlyInvoice(client_id, req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Monthly invoice not found' });

    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const invoice = await updateMonthlyInvoice(client_id, req.params.id, req.body);
    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    // Deleting frees its jobs back up for a future statement, so only allow
    // it while the invoice is still a draft nobody has been sent.
    const existing = await getMonthlyInvoice(client_id, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Monthly invoice not found' });
    if (existing.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft monthly invoices can be deleted' });
    }

    await deleteMonthlyInvoice(client_id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/send', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const result = await sendMonthlyInvoiceManually(client_id, req.params.id);
    if (result?.error) return res.status(400).json({ error: result.error });

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
