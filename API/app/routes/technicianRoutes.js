import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import { listTechnicians, getTechnician, createTechnician, updateTechnician, deleteTechnician } from '../services/technicianService.js';

const router = express.Router();

router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const technicians = await listTechnicians(client_id);
    res.json({ data: technicians });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id, name, phone } = req.body;
    if (!client_id || !name || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const technician = await createTechnician(client_id, req.body);
    res.json({ data: technician });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const technician = await getTechnician(client_id, req.params.id);
    if (!technician) return res.status(404).json({ error: 'Technician not found' });

    res.json({ data: technician });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const technician = await updateTechnician(client_id, req.params.id, req.body);
    res.json({ data: technician });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const technician = await deleteTechnician(client_id, req.params.id);
    res.json({ data: technician });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
