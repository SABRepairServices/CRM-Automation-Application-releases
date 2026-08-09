import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import db from '../../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { isConfigured } from '../services/whatsappService.js';

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN_DOCS = path.resolve(__dirname, '../../dry-run-documents');

/**
 * Builds the exact envelope Meta's WhatsApp Cloud API posts to a webhook.
 * Deliberately verbatim — including the fields the bot doesn't read yet —
 * so the simulator can never pass on a payload shape that real Meta traffic
 * would fail on. Shape reference: WhatsApp Cloud API v21.0 "messages" webhook.
 */
const buildMetaPayload = ({ from, body, type = 'text', profileName = 'Simulated User', phoneNumberId }) => {
  const timestamp = String(Math.floor(new Date().getTime() / 1000));
  // Meta message IDs are opaque base64-ish strings prefixed wamid.
  const messageId = `wamid.SIM${Buffer.from(`${from}:${timestamp}:${Math.floor(Math.random() * 1e9)}`).toString('base64').replace(/=/g, '')}`;

  const message = {
    from: String(from).replace(/\D/g, ''), // Meta sends E.164 digits only, no leading +
    id: messageId,
    timestamp,
    type,
  };

  if (type === 'text') {
    message.text = { body };
  } else if (type === 'audio') {
    message.audio = { id: `sim-media-${timestamp}`, mime_type: 'audio/ogg; codecs=opus', voice: true };
  } else if (type === 'image') {
    message.image = { id: `sim-media-${timestamp}`, mime_type: 'image/jpeg', sha256: 'simulated' };
  } else if (type === 'document') {
    message.document = { id: `sim-media-${timestamp}`, mime_type: 'application/pdf', filename: 'customer-upload.pdf' };
  } else if (type === 'button') {
    message.button = { text: body, payload: body };
  } else if (type === 'interactive') {
    message.interactive = { type: 'button_reply', button_reply: { id: 'sim-btn', title: body } };
  }

  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'SIMULATED_WABA_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: phoneNumberId || 'SIMULATED',
                phone_number_id: phoneNumberId || 'SIMULATED',
              },
              contacts: [{ profile: { name: profileName }, wa_id: String(from).replace(/\D/g, '') }],
              messages: [message],
            },
          },
        ],
      },
    ],
  };
};

/**
 * Posts the payload to this server's own webhook over real HTTP, so the
 * simulator exercises the entire production path — Express routing, JSON
 * parsing, the webhook handler, the bot service — with nothing stubbed.
 * The only thing that differs from production is that outbound sends are
 * logged rather than handed to Meta (whatsappService dry-run mode).
 */
const postToOwnWebhook = async (req, payload) => {
  const port = process.env.PORT || process.env.API_PORT || 5000;
  const response = await fetch(`http://127.0.0.1:${port}/api/whatsapp/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: response.status, ok: response.ok };
};

/**
 * Simulator status — surfaces whether the bot is still in dry-run and how
 * the simulated environment is wired, so the operator is never guessing
 * about what they're actually testing.
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const techs = await db.query(
      `SELECT id, name, phone, client_id FROM technicians WHERE is_active = TRUE ORDER BY created_at ASC`
    );
    const clients = await db.query(`SELECT id, name FROM clients WHERE is_active = TRUE ORDER BY created_at ASC`);
    res.json({
      data: {
        dryRun: !isConfigured(),
        liveCredentials: isConfigured(),
        verifyTokenSet: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
        technicians: techs.rows,
        clients: clients.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Sends one simulated inbound message, then returns everything the bot did
 * in response. Polls the message log briefly because the webhook replies
 * 200 immediately and processes asynchronously — exactly as it does for
 * real Meta traffic, which also expects a fast ack.
 */
router.post('/inbound', authenticate, async (req, res) => {
  try {
    const { from, body, type = 'text', profileName } = req.body;
    if (!from) return res.status(400).json({ error: 'from (phone number) is required' });
    if (type === 'text' && !body) return res.status(400).json({ error: 'body is required for text messages' });

    // Keep the marker as a STRING, never a JS Date. whatsapp_messages.created_at
    // is TIMESTAMP WITHOUT TIME ZONE, so round-tripping a Date through
    // node-postgres shifts it by the local UTC offset and the ">" comparison
    // silently matches nothing.
    const marker = await db.query(
      `SELECT to_char(COALESCE(MAX(created_at), NOW() - INTERVAL '1 second'), 'YYYY-MM-DD HH24:MI:SS.US') AS t
       FROM whatsapp_messages`
    );
    const since = marker.rows[0].t;

    const payload = buildMetaPayload({ from, body, type, profileName, phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID });
    const webhookResult = await postToOwnWebhook(req, payload);

    // The bot processes after acking, so wait for it to settle rather than
    // reporting an empty result the operator would misread as "nothing happened".
    let responses = [];
    for (let attempt = 0; attempt < 25; attempt += 1) {
      await new Promise((r) => setTimeout(r, 200));
      const rows = await db.query(
        `SELECT id, direction, from_number, to_number, body, raw_payload, created_at
         FROM whatsapp_messages
         WHERE created_at > $1::timestamp
         ORDER BY created_at ASC`,
        [since]
      );
      responses = rows.rows;
      const outbound = responses.filter((r) => r.direction === 'outbound');
      if (outbound.length > 0) {
        // Give any follow-on sends (e.g. customer doc + technician notice) a
        // moment to land so the operator sees the complete reaction at once.
        await new Promise((r) => setTimeout(r, 400));
        const settled = await db.query(
          `SELECT id, direction, from_number, to_number, body, raw_payload, created_at
           FROM whatsapp_messages WHERE created_at > $1::timestamp ORDER BY created_at ASC`,
          [since]
        );
        responses = settled.rows;
        break;
      }
    }

    res.json({
      data: {
        webhookStatus: webhookResult.status,
        sentPayload: payload,
        messages: responses,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Full message log for the simulator UI, newest last so it reads like a chat.
 */
router.get('/conversation', authenticate, async (req, res) => {
  try {
    const { number, limit = 200 } = req.query;
    let query = `SELECT id, client_id, direction, from_number, to_number, body, raw_payload, created_at
                 FROM whatsapp_messages`;
    const params = [];
    if (number) {
      const tail = String(number).replace(/\D/g, '').slice(-9);
      query += ` WHERE RIGHT(REGEXP_REPLACE(COALESCE(from_number, ''), '\\D', '', 'g'), 9) = $1
                    OR RIGHT(REGEXP_REPLACE(COALESCE(to_number, ''), '\\D', '', 'g'), 9) = $1`;
      params.push(tail);
    }
    query += ` ORDER BY created_at ASC LIMIT ${Number(limit)}`;
    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Open threads with their live state — lets the operator see the state
 * machine itself, not just the messages, which is where flow bugs hide.
 */
router.get('/threads', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, c.name AS customer_name, rj.job_number, rj.appliance_type, rj.status AS job_status
       FROM whatsapp_job_threads t
       LEFT JOIN repair_jobs rj ON t.job_id = rj.id
       LEFT JOIN customers c ON rj.customer_id = c.id
       ORDER BY t.updated_at DESC LIMIT 50`
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Serves a PDF the bot generated during a dry run, so the operator can open
 * the actual document a customer would have received.
 */
router.get('/document/:filename', authenticate, (req, res) => {
  const safe = String(req.params.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(DRY_RUN_DOCS, safe);
  if (!filePath.startsWith(DRY_RUN_DOCS) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.type('application/pdf').sendFile(filePath);
});

/**
 * Wipes everything a simulation run created for one client — threads,
 * messages, and the jobs/documents/customers the bot generated — so a fresh
 * scenario starts clean. Scoped to simulator-created records only.
 */
router.post('/reset', authenticate, async (req, res) => {
  try {
    const { client_id } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id is required' });

    const threads = await db.query(`SELECT job_id FROM whatsapp_job_threads WHERE client_id = $1`, [client_id]);
    const jobIds = threads.rows.map((r) => r.job_id).filter(Boolean);

    await db.query(`DELETE FROM whatsapp_messages WHERE client_id = $1 OR client_id IS NULL`, [client_id]);
    await db.query(`DELETE FROM whatsapp_job_threads WHERE client_id = $1`, [client_id]);

    if (jobIds.length > 0) {
      await db.query(`DELETE FROM invoice_jobs WHERE job_id = ANY($1)`, [jobIds]);
      await db.query(
        `DELETE FROM invoices WHERE id NOT IN (SELECT invoice_id FROM invoice_jobs WHERE invoice_id IS NOT NULL)
           AND client_id = $1 AND notes LIKE 'Auto-generated%'`,
        [client_id]
      );
      await db.query(
        `DELETE FROM quotation_items WHERE quotation_id IN (SELECT id FROM quotations WHERE job_id = ANY($1))`,
        [jobIds]
      );
      await db.query(`DELETE FROM quotations WHERE job_id = ANY($1)`, [jobIds]);
      await db.query(
        `DELETE FROM inspection_findings WHERE inspection_report_id IN (SELECT id FROM inspection_reports WHERE job_id = ANY($1))`,
        [jobIds]
      );
      await db.query(`DELETE FROM inspection_reports WHERE job_id = ANY($1)`, [jobIds]);
      await db.query(`DELETE FROM repair_jobs WHERE id = ANY($1)`, [jobIds]);
    }

    res.json({ data: { clearedThreads: threads.rows.length, clearedJobs: jobIds.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
