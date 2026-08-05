import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import * as customerService from '../services/customerService.js';

const router = express.Router();

/**
 * GET /api/customers - List customers for a client
 * Query params: status, source
 */
router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id: clientId } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId required' });
    }

    const filters = {
      status: req.query.status,
      source: req.query.source,
    };

    const customers = await customerService.listCustomers(clientId, filters);
    res.json({ success: true, data: customers, count: customers.length });
  } catch (error) {
    console.error('Error listing customers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customers/:id - Get single customer
 */
router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id: clientId } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId required' });
    }

    const customer = await customerService.getCustomer(req.params.id, clientId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customers - Create new customer (lead)
 * Body: { clientId, name, phone, whatsapp?, email?, area?, address?, source?, status?, billing_type?, notes? }
 */
router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id: clientId, name, phone, whatsapp, email, area, address, source, status, billing_type, notes } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'clientId required' });
    }

    const customer = await customerService.createCustomer(clientId, {
      name,
      phone,
      whatsapp,
      email,
      area,
      address,
      source,
      status,
      billing_type,
      notes,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/customers/:id - Update customer
 */
router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id: clientId } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId required' });
    }

    const customer = await customerService.updateCustomer(req.params.id, clientId, req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/customers/:id - Delete customer
 */
router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id: clientId } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId required' });
    }

    await customerService.deleteCustomer(req.params.id, clientId);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/customers/stats/overview - Customer statistics
 */
router.get('/stats/overview', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id: clientId } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId required' });
    }

    const stats = await customerService.getCustomerStats(clientId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customers/bulk - Bulk import customers
 * Body: { clientId, customers: [{name, phone, ...}, ...] }
 */
router.post('/bulk', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id: clientId, customers } = req.body;

    if (!clientId || !Array.isArray(customers)) {
      return res.status(400).json({ error: 'clientId and customers array required' });
    }

    const results = await customerService.bulkCreateCustomers(clientId, customers);
    const successful = results.filter(r => r.success).length;

    res.json({
      success: true,
      imported: successful,
      failed: results.length - successful,
      details: results,
    });
  } catch (error) {
    console.error('Error bulk importing:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
