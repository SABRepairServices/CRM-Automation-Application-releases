import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as clientService from '../services/clientService.js';

const router = express.Router();

/**
 * GET /api/clients - List all clients for user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const clients = await clientService.listClients(req.user.userId);
    res.json({ success: true, data: clients, count: clients.length });
  } catch (error) {
    console.error('Error listing clients:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clients/:id - Get single client
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const client = await clientService.getClient(req.params.id, req.user.userId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Error getting client:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clients - Create new client
 * Body: { name, business_type?, industry?, website?, email?, phone?, address?, city?, country?, logo_url?, brand_color? }
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const client = await clientService.createClient(req.user.userId, req.body);
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/clients/:id - Update client
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const client = await clientService.updateClient(req.params.id, req.user.userId, req.body);
    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/clients/:id - Delete client (soft delete)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await clientService.deleteClient(req.params.id, req.user.userId);
    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/clients/:id/stats - Get client statistics
 */
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const stats = await clientService.getClientStats(req.params.id, req.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clients/:id/whatsapp - WhatsApp connection status (no token returned)
 */
router.get('/:id/whatsapp', authenticate, async (req, res) => {
  try {
    const status = await clientService.getWhatsappStatus(req.params.id, req.user.userId);
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/clients/:id/whatsapp - Save or clear WhatsApp Business credentials
 * Body: { token, phoneNumberId, displayNumber } — send empty strings to disconnect
 */
router.put('/:id/whatsapp', authenticate, async (req, res) => {
  try {
    const { token, phoneNumberId, displayNumber } = req.body;
    const result = await clientService.updateWhatsappCredentials(req.params.id, req.user.userId, { token, phoneNumberId, displayNumber });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating WhatsApp credentials:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
