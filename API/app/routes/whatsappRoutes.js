import express from 'express';
import db from '../../config/database.js';
import { sendText, logMessage, findTechnicianByPhone } from '../services/whatsappService.js';
import { handleTechnicianMessage, handleCustomerReply } from '../services/whatsappBotService.js';

const router = express.Router();

/**
 * Meta's one-time webhook verification handshake. Meta calls this GET
 * with the token you set in the Meta app dashboard; echoing back
 * hub.challenge proves you control the endpoint.
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

const findOpenThreadForCustomer = async (fromNumber) => {
  const tail = fromNumber.replace(/\D/g, '').slice(-9);
  const result = await db.query(
    `SELECT * FROM whatsapp_job_threads
     WHERE status = 'awaiting_customer'
       AND RIGHT(REGEXP_REPLACE(customer_whatsapp, '\\D', '', 'g'), 9) = $1
     ORDER BY updated_at DESC LIMIT 1`,
    [tail]
  );
  return result.rows[0] || null;
};

/**
 * Inbound message webhook. Routes to the technician command handler
 * (INP/QOT/INV/DONE) if the sender is a known technician, otherwise
 * checks whether it's a customer replying to an open approval thread.
 */
router.post('/webhook', async (req, res) => {
  // Meta expects a fast 200 regardless of what we do with the payload.
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message) return; // status callbacks, read receipts, etc. — nothing to do yet

    const from = message.from;
    const body = message.text?.body || '';

    const technician = await findTechnicianByPhone(from);
    await logMessage({
      clientId: technician?.client_id || null,
      threadId: null,
      direction: 'inbound',
      from,
      to: process.env.WHATSAPP_PHONE_NUMBER_ID || 'unset',
      body,
      raw: req.body,
    });

    console.log(`[WhatsApp] inbound from ${from} (${technician ? technician.name : 'unknown number'}): ${body}`);

    if (technician) {
      await handleTechnicianMessage(technician, from, body);
      return;
    }

    const thread = await findOpenThreadForCustomer(from);
    if (thread) {
      await handleCustomerReply(thread, from, body);
      return;
    }

    await sendText(from, `This number isn't registered as a technician, and there's no open request waiting on a reply from you.`);
  } catch (err) {
    console.error('[WhatsApp] webhook handling error:', err.message);
  }
});

export default router;
