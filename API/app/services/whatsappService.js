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
 * Uploads a PDF to Meta's Media API, returning the media ID needed by both
 * a free-form document message and a template's document header. Shared so
 * the two send paths below don't duplicate this.
 */
const uploadMedia = async (buffer, filename) => {
  const mediaForm = new FormData();
  mediaForm.append('messaging_product', 'whatsapp');
  mediaForm.append('file', new Blob([buffer], { type: 'application/pdf' }), filename);

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
    { method: 'POST', headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }, body: mediaForm }
  );
  const result = await response.json();
  if (!response.ok) {
    console.error('[WhatsApp] media upload failed:', result);
    return { ok: false, error: result?.error || result };
  }
  return { ok: true, id: result.id };
};

/**
 * True if this number has messaged us within the last 24 hours. Meta's rule:
 * outside that window, only a pre-approved TEMPLATE message can open a new
 * business-initiated conversation — free-form text/document messages are
 * rejected outright. Checked against our own message log rather than
 * assumed, since "first message of a job" and "within Meta's window" are
 * not actually the same thing (a customer might have messaged about a
 * different matter recently).
 */
const isWithin24HourWindow = async (customerNumber) => {
  const tail = String(customerNumber).replace(/\D/g, '').slice(-9);
  const result = await db.query(
    `SELECT 1 FROM whatsapp_messages
     WHERE direction = 'inbound'
       AND RIGHT(REGEXP_REPLACE(COALESCE(from_number, ''), '\\D', '', 'g'), 9) = $1
       AND created_at > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [tail]
  );
  return result.rows.length > 0;
};

/**
 * Sends a pre-approved template message with a PDF as the header attachment
 * — the only way to reach a customer outside the 24-hour window. The
 * template must already exist and be APPROVED in Meta Business Manager
 * before this will work; see WHATSAPP_TEMPLATES.md for the exact templates
 * this app expects and how to submit them.
 */
const sendTemplateDocument = async (to, { templateName, languageCode = 'en_US', buffer, filename, bodyParams = [] }, { clientId = null, threadId = null } = {}) => {
  if (!isConfigured()) {
    const saved = persistDryRunDocument(filename, buffer);
    console.log(`[WhatsApp:DRY-RUN] -> ${to}: [TEMPLATE ${templateName}] [document: ${filename}] params=${JSON.stringify(bodyParams)}`);
    await logMessage({
      clientId,
      threadId,
      direction: 'outbound',
      from: process.env.WHATSAPP_PHONE_NUMBER_ID || 'unset',
      to,
      body: `[template:${templateName}] [document: ${filename}]`,
      raw: saved ? { dryRunDocument: saved, bytes: buffer?.length ?? 0, template: templateName, bodyParams } : null,
    });
    return { ok: true, dryRun: true, document: saved };
  }

  const mediaResult = await uploadMedia(buffer, filename);
  if (!mediaResult.ok) {
    await logMessage({
      clientId,
      threadId,
      direction: 'outbound',
      from: process.env.WHATSAPP_PHONE_NUMBER_ID,
      to,
      body: `[FAILED to upload document for template ${templateName}: ${filename}]`,
      raw: mediaResult.error,
    });
    return { ok: false, error: mediaResult.error, stage: 'media_upload' };
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
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: 'header',
            parameters: [{ type: 'document', document: { id: mediaResult.id, filename } }],
          },
          ...(bodyParams.length > 0
            ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text: String(text) })) }]
            : []),
        ],
      },
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error(`[WhatsApp] template "${templateName}" send failed:`, result);
  }

  await logMessage({ clientId, threadId, direction: 'outbound', from: process.env.WHATSAPP_PHONE_NUMBER_ID, to, body: `[template:${templateName}] [document: ${filename}]`, raw: result });
  return { ok: response.ok, error: response.ok ? null : result?.error || result, stage: 'template_send', raw: result };
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

  const mediaResult = await uploadMedia(buffer, filename);
  if (!mediaResult.ok) {
    // Log the failure too — otherwise a rejected upload leaves no trace at
    // all beyond one console line, and the job silently waits forever.
    await logMessage({
      clientId,
      threadId,
      direction: 'outbound',
      from: process.env.WHATSAPP_PHONE_NUMBER_ID,
      to,
      body: `[FAILED to upload document: ${filename}]`,
      raw: mediaResult.error,
    });
    return { ok: false, error: mediaResult.error, stage: 'media_upload' };
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

export { sendText, sendDocument, sendTemplateDocument, isWithin24HourWindow, logMessage, findTechnicianByPhone, isConfigured };
