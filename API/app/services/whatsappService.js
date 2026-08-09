import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../../config/database.js';

const GRAPH_API_VERSION = 'v21.0';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN_DOCS = path.resolve(__dirname, '../../dry-run-documents');

/**
 * In dry-run the PDF is still fully generated — it just has nowhere to go.
 * Writing it to disk lets the simulator show the operator the exact file a
 * real customer would receive, which is the whole point of testing without
 * a live number. Never called once real credentials are configured.
 */
const persistDryRunDocument = (filename, buffer) => {
  try {
    fs.mkdirSync(DRY_RUN_DOCS, { recursive: true });
    const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(DRY_RUN_DOCS, safe);
    fs.writeFileSync(filePath, buffer);
    return safe;
  } catch (err) {
    console.error('[WhatsApp:DRY-RUN] could not persist document:', err.message);
    return null;
  }
};

const graphUrl = () =>
  `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const isConfigured = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

/**
 * Sends a plain text WhatsApp message via the Meta Cloud API and logs it.
 * No-ops (logging only) when WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID aren't
 * set yet, so the rest of the bot can be built and tested before the Meta
 * business number is verified.
 */
const sendText = async (to, body, { clientId = null, threadId = null } = {}) => {
  if (!isConfigured()) {
    console.log(`[WhatsApp:DRY-RUN] -> ${to}: ${body}`);
    await logMessage({ clientId, threadId, direction: 'outbound', from: process.env.WHATSAPP_PHONE_NUMBER_ID || 'unset', to, body, raw: null });
    return { dryRun: true };
  }

  const response = await fetch(graphUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error('[WhatsApp] send failed:', result);
  }

  await logMessage({ clientId, threadId, direction: 'outbound', from: process.env.WHATSAPP_PHONE_NUMBER_ID, to, body, raw: result });
  // Meta signals refusal (expired 24h window, unregistered recipient, rate
  // limit) with a 4xx body, not a thrown error. Callers must be able to tell
  // "delivered" from "refused", or they will report success for a message
  // the customer never saw.
  return { ok: response.ok, error: response.ok ? null : result?.error || result, raw: result };
};

/**
 * Sends a PDF as a WhatsApp document message. Meta requires the file to be
 * uploaded to their Media API first (or referenced by a public URL) before
 * it can be attached to a message — this uploads the buffer, then sends.
 * Dry-run mode (no token configured) just logs it.
 */
const sendDocument = async (to, { buffer, filename, caption }, { clientId = null, threadId = null } = {}) => {
  if (!isConfigured()) {
    const saved = persistDryRunDocument(filename, buffer);
    console.log(`[WhatsApp:DRY-RUN] -> ${to}: [document: ${filename}] ${caption || ''}`);
    await logMessage({
      clientId,
      threadId,
      direction: 'outbound',
      from: process.env.WHATSAPP_PHONE_NUMBER_ID || 'unset',
      to,
      body: `[document: ${filename}] ${caption || ''}`,
      raw: saved ? { dryRunDocument: saved, bytes: buffer?.length ?? 0 } : null,
    });
    return { ok: true, dryRun: true, document: saved };
  }

  const mediaForm = new FormData();
  mediaForm.append('messaging_product', 'whatsapp');
  mediaForm.append('file', new Blob([buffer], { type: 'application/pdf' }), filename);

  const mediaResponse = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
    { method: 'POST', headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }, body: mediaForm }
  );
  const mediaResult = await mediaResponse.json();
  if (!mediaResponse.ok) {
    console.error('[WhatsApp] media upload failed:', mediaResult);
    // Log the failure too — otherwise a rejected upload leaves no trace at
    // all beyond one console line, and the job silently waits forever.
    await logMessage({
      clientId,
      threadId,
      direction: 'outbound',
      from: process.env.WHATSAPP_PHONE_NUMBER_ID,
      to,
      body: `[FAILED to upload document: ${filename}]`,
      raw: mediaResult,
    });
    return { ok: false, error: mediaResult?.error || mediaResult, stage: 'media_upload' };
  }

  const response = await fetch(graphUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: { id: mediaResult.id, filename, caption },
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error('[WhatsApp] document send failed:', result);
  }

  await logMessage({ clientId, threadId, direction: 'outbound', from: process.env.WHATSAPP_PHONE_NUMBER_ID, to, body: `[document: ${filename}] ${caption || ''}`, raw: result });
  return { ok: response.ok, error: response.ok ? null : result?.error || result, stage: 'message_send', raw: result };
};

const logMessage = async ({ clientId, threadId, direction, from, to, body, raw }) => {
  await db.query(
    `INSERT INTO whatsapp_messages (client_id, thread_id, direction, from_number, to_number, body, raw_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [clientId, threadId, direction, from, to, body, raw ? JSON.stringify(raw) : null]
  );
};

/**
 * Finds the technician a given WhatsApp number belongs to, matching on the
 * last 9 digits so country-code/formatting differences (+971 vs 00971 vs
 * a bare local number) don't cause a miss.
 */
const findTechnicianByPhone = async (whatsappNumber) => {
  const tail = String(whatsappNumber).replace(/\D/g, '').slice(-9);
  const result = await db.query(
    `SELECT * FROM technicians WHERE is_active = TRUE AND RIGHT(REGEXP_REPLACE(phone, '\\D', '', 'g'), 9) = $1 LIMIT 1`,
    [tail]
  );
  return result.rows[0] || null;
};

export { sendText, sendDocument, logMessage, findTechnicianByPhone, isConfigured };
