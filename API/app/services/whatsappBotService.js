import db from '../../config/database.js';
import { sendText, sendDocument, sendTemplateDocument, isWithin24HourWindow } from './whatsappService.js';
import { parseTechnicianMessage } from './aiParserService.js';
import { sendPdfEmail } from './emailService.js';
import { generateInspectionPdf, generateQuotationPdf, generateInvoicePdf } from './pdfService.js';
import { createInspectionReport, getInspectionReport, updateInspectionReport } from './inspectionService.js';
import { getQuotation, updateQuotation } from './quotationService.js';
import { getInvoice, createInvoice } from './invoiceService.js';
import { createJob } from './jobService.js';
import { createCustomer } from './customerService.js';

// The webhook has no logged-in user context (Meta calls it server-to-server),
// so we can't use clientService.getClient (which scopes by user_id) — fetch
// the client record directly, trusting the client_id we already resolved
// from the technician's record.
const getClientById = async (clientId) => {
  const result = await db.query(`SELECT * FROM clients WHERE id = $1`, [clientId]);
  return result.rows[0] || null;
};

const APPROVE_WORDS = ['approve', 'approved', 'yes', 'ok', 'okay', 'confirm', 'confirmed', 'go ahead'];
const REJECT_WORDS = ['reject', 'rejected', 'no', 'cancel', 'cancelled', 'decline', 'declined'];

/**
 * Technician message format (semi-structured — see FUTURE_WORK.md for the
 * planned free-text/AI-parsed upgrade). First line is the command, the
 * rest are "Key: value" pairs:
 *
 *   INP
 *   Customer: Fatima Al Mansoori
 *   Phone: 0501234567
 *   Appliance: Dishwasher
 *   Findings: Drain pump seized; Filter clogged
 *   Amount: 250
 *
 * QOT and INV use the same shape (Items instead of Findings) and skip
 * straight to a Quotation or Invoice, for customers who don't need an
 * inspection step first.
 */
const parseCommand = (body) => {
  const lines = body.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const command = lines[0].toUpperCase();
  if (!['INP', 'QOT', 'INV'].includes(command)) return null;

  const fields = {};
  for (const line of lines.slice(1)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    fields[key] = value;
  }

  return { command, fields };
};

const isDoneMessage = (body) => /^\s*done\b/i.test(body.trim());

const resolveCustomerAndJob = async (clientId, fields) => {
  const phone = fields.phone;
  const name = fields.customer || 'Unknown Customer';
  if (!phone) throw new Error('Message is missing "Phone:" for the customer');

  const tail = phone.replace(/\D/g, '').slice(-9);
  const existing = await db.query(
    `SELECT * FROM customers WHERE client_id = $1 AND RIGHT(REGEXP_REPLACE(phone, '\\D', '', 'g'), 9) = $2 LIMIT 1`,
    [clientId, tail]
  );
  const customer = existing.rows[0] || (await createCustomer(clientId, { name, phone, whatsapp: phone, source: 'whatsapp' }));

  const job = await createJob(clientId, {
    customer_id: customer.id,
    appliance_type: fields.appliance || null,
    reported_fault: fields.findings || fields.items || null,
  });

  return { customer, job };
};

const openThread = async ({ clientId, jobId, technicianId, stage, documentType, documentId, customerWhatsapp, technicianWhatsapp }) => {
  const result = await db.query(
    `INSERT INTO whatsapp_job_threads
       (client_id, job_id, technician_id, stage, document_type, document_id, customer_whatsapp, technician_whatsapp, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'awaiting_customer')
     RETURNING *`,
    [clientId, jobId, technicianId, stage, documentType, documentId, customerWhatsapp, technicianWhatsapp]
  );
  return result.rows[0];
};

/**
 * Delivers a generated PDF over both channels and reports what actually
 * happened on each. Two rules here are load-bearing:
 *
 *  1. Email is a secondary channel. Its failure must never unwind the caller,
 *     because by then the WhatsApp document is already in the customer's hand
 *     and the caller still has to record the thread — otherwise the customer
 *     replies "approved" to a thread that was never opened and gets told no
 *     request is waiting on them.
 *  2. A WhatsApp send that Meta refused is NOT a delivery. sendDocument
 *     reports {ok:false} rather than throwing (expired 24h window, blocked
 *     recipient, rate limit), so the result has to be inspected and passed
 *     back up, or the technician is told "sent" about a message nobody got.
 */
const deliverDocument = async ({ customer, buffer, filename, caption, subject, emailText, threadCtx, template }) => {
  let whatsappSent = false;
  let whatsappError = null;
  let emailError = null;

  if (customer.whatsapp) {
    const withinWindow = await isWithin24HourWindow(customer.whatsapp);
    const result = withinWindow
      ? await sendDocument(customer.whatsapp, { buffer, filename, caption }, threadCtx)
      : await sendTemplateDocument(
          customer.whatsapp,
          { templateName: template.name, bodyParams: template.params, buffer, filename },
          threadCtx
        );
    whatsappSent = Boolean(result?.ok);
    if (!whatsappSent) whatsappError = result?.error?.message || 'WhatsApp rejected the message';
  }

  if (customer.email) {
    try {
      await sendPdfEmail({ to: customer.email, subject, text: emailText, filename, pdfBuffer: buffer });
    } catch (err) {
      emailError = err.message;
      console.error('[Email] send failed:', err.message);
    }
  }

  return { whatsappSent, whatsappError, emailError, hasWhatsapp: Boolean(customer.whatsapp) };
};

/** Turns a delivery result into a line the technician can act on. */
const deliveryNote = (delivery, who) => {
  if (delivery.hasWhatsapp && !delivery.whatsappSent) {
    return `\n⚠️ WhatsApp delivery to ${who} FAILED (${delivery.whatsappError}). They have not seen it — follow up directly.`;
  }
  if (delivery.emailError) {
    return `\n(Sent on WhatsApp. The email copy failed: ${delivery.emailError})`;
  }
  return '';
};

const sendInspectionToCustomer = async (client, customer, job, report, threadCtx) => {
  const full = await getInspectionReport(client.id, report.id);
  const pdf = await generateInspectionPdf({ client, report: full, customerName: customer.name, customerPhone: customer.phone });

  return deliverDocument({
    customer,
    buffer: pdf,
    filename: `Inspection_${report.report_number}.pdf`,
    caption: `Inspection report for your ${job.appliance_type || 'appliance'} — reply "approved" to proceed with a quotation, or let us know if you'd like changes.`,
    subject: `Inspection Report ${report.report_number}`,
    emailText: 'Please find your inspection report attached.',
    threadCtx,
    // See WHATSAPP_TEMPLATES.md — must exist and be APPROVED in Meta
    // Business Manager before this path can actually send anything.
    template: { name: 'inspection_ready', params: [customer.name, job.appliance_type || 'appliance'] },
  });
};

const sendQuotationToCustomer = async (client, customer, job, quotation, threadCtx) => {
  const full = await getQuotation(client.id, quotation.id);
  const pdf = await generateQuotationPdf({ client, quotation: full, customerName: customer.name, customerPhone: customer.phone });

  return deliverDocument({
    customer,
    buffer: pdf,
    filename: `Quotation_${quotation.quotation_number}.pdf`,
    caption: `Quotation for your ${job.appliance_type || 'appliance'} repair — reply "approved" to proceed, or let us know if you'd like to discuss.`,
    subject: `Quotation ${quotation.quotation_number}`,
    emailText: 'Please find your quotation attached.',
    threadCtx,
    template: { name: 'quotation_ready', params: [customer.name, job.appliance_type || 'appliance'] },
  });
};

const sendInvoiceToCustomer = async (client, customer, invoice, threadCtx = {}) => {
  const full = await getInvoice(client.id, invoice.id);
  const pdf = await generateInvoicePdf({ client, invoice: full, customerName: customer.name, customerPhone: customer.phone });
  const total = Number(invoice.total_amount).toFixed(2);

  return deliverDocument({
    customer,
    buffer: pdf,
    filename: `Invoice_${invoice.invoice_number}.pdf`,
    caption: `Invoice ${invoice.invoice_number} — total ${total} AED.`,
    subject: `Invoice ${invoice.invoice_number}`,
    emailText: 'Please find your invoice attached.',
    threadCtx,
    template: { name: 'invoice_ready', params: [customer.name, total] },
  });
};

/**
 * Entry point for a message from a known technician's WhatsApp number.
 * Handles INP/QOT/INV commands and "DONE" completion messages.
 */
const handleTechnicianMessage = async (technician, from, body) => {
  if (isDoneMessage(body)) {
    return handleTechnicianDone(technician, from);
  }

  // Try the AI free-text parser first (natural language, any order, any
  // phrasing). Falls back to the rigid "Key: value" parser when no
  // ANTHROPIC_API_KEY is configured, or when the AI call itself fails, so
  // the bot never goes fully silent.
  let parsed;
  try {
    parsed = await parseTechnicianMessage(body);
  } catch (err) {
    console.error('[WhatsAppBot] AI parse failed, falling back to structured parser:', err.message);
    parsed = null;
  }
  if (!parsed) parsed = parseCommand(body);

  if (parsed?.command === null) {
    await sendText(from, parsed.clarification || `Didn't catch that — tell me the customer's phone number and whether this is an inspection, quotation, or invoice.`, { clientId: technician.client_id });
    return;
  }
  if (!parsed) {
    await sendText(from, `Didn't recognize that. Tell me the customer, phone number, appliance, and what you found or the price — I'll work out the rest.`, { clientId: technician.client_id });
    return;
  }

  const client = await getClientById(technician.client_id);
  const { customer, job } = await resolveCustomerAndJob(technician.client_id, parsed.fields);
  const threadCtx = { clientId: technician.client_id };

  if (parsed.command === 'INP') {
    const report = await createInspectionReport(technician.client_id, {
      job_id: job.id,
      inspected_by: technician.name,
      findings: (parsed.fields.findings || '').split(';').map((s) => s.trim()).filter(Boolean).map((description) => ({ description })),
      taxable_amount: Number(parsed.fields.amount) || 0,
      tax_rate: 5.0,
    });
    const delivery = await sendInspectionToCustomer(client, customer, job, report, threadCtx);
    await openThread({ clientId: technician.client_id, jobId: job.id, technicianId: technician.id, stage: 'inspection_sent', documentType: 'inspection', documentId: report.id, customerWhatsapp: customer.whatsapp, technicianWhatsapp: from });
    await sendText(
      from,
      `Inspection ${report.report_number} sent to ${customer.name}. I'll let you know when they reply.${deliveryNote(delivery, customer.name)}`,
      threadCtx
    );
    return;
  }

  if (parsed.command === 'QOT' || parsed.command === 'INV') {
    // Both skip the inspection step and build a single-line-item document
    // straight from the technician's message, reusing the same auto-chain
    // machinery the app UI uses (finalize-inspection -> quotation).
    const amount = Number(parsed.fields.amount) || 0;
    const description = parsed.fields.items || parsed.fields.findings || 'Repair work';

    if (parsed.command === 'QOT') {
      const quotation = await createQuotationDirect(technician.client_id, job.id, description, amount);
      const delivery = await sendQuotationToCustomer(client, customer, job, quotation, threadCtx);
      await openThread({ clientId: technician.client_id, jobId: job.id, technicianId: technician.id, stage: 'quotation_sent', documentType: 'quotation', documentId: quotation.id, customerWhatsapp: customer.whatsapp, technicianWhatsapp: from });
      await sendText(
        from,
        `Quotation ${quotation.quotation_number} sent to ${customer.name}.${deliveryNote(delivery, customer.name)}`,
        threadCtx
      );
    } else {
      const invoice = await createInvoice(technician.client_id, {
        customer_id: customer.id,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        job_amounts: [{ job_id: job.id, amount }],
        notes: description,
      });
      if (customer.billing_type === 'contractor') {
        await sendText(from, `Invoice ${invoice.invoice_number} created and queued — contractor invoices are batched and sent in the last 3 days of the month.`, threadCtx);
      } else {
        const delivery = await sendInvoiceToCustomer(client, customer, invoice, threadCtx);
        await sendText(
          from,
          `Invoice ${invoice.invoice_number} sent to ${customer.name}.${deliveryNote(delivery, customer.name)}`,
          threadCtx
        );
      }
    }
  }
};

const createQuotationDirect = async (clientId, jobId, description, amount) => {
  const result = await db.query(
    `INSERT INTO quotations (client_id, job_id, labour_amount, parts_amount, discount_amount, vat_percent, total_amount, status, notes)
     VALUES ($1, $2, $3, 0, 0, 5.0, $4, 'draft', 'Created via WhatsApp')
     RETURNING *`,
    [clientId, jobId, amount, amount * 1.05]
  );
  const quotation = result.rows[0];
  await db.query(
    `INSERT INTO quotation_items (quotation_id, description, item_type, quantity, unit_price, line_total, sort_order)
     VALUES ($1, $2, 'labour', 1, $3, $3, 0)`,
    [quotation.id, description, amount]
  );
  return quotation;
};

/**
 * Entry point for a reply from a customer's WhatsApp number, matched to
 * whichever job thread is currently awaiting their response.
 */
const handleCustomerReply = async (thread, from, body) => {
  const lower = body.trim().toLowerCase();
  const isApprove = APPROVE_WORDS.some((w) => lower.includes(w));
  const isReject = REJECT_WORDS.some((w) => lower.includes(w));

  if (!isApprove && !isReject) {
    // Ambiguous / negotiation — don't try to interpret it, hand it to the technician.
    if (thread.technician_whatsapp) {
      await sendText(thread.technician_whatsapp, `Customer replied about job (thread ${thread.id.slice(0, 8)}): "${body}" — needs your attention.`, { clientId: thread.client_id, threadId: thread.id });
    }
    return;
  }

  const client = await getClientById(thread.client_id);

  if (isReject) {
    await db.query(`UPDATE whatsapp_job_threads SET status = 'rejected', updated_at = NOW() WHERE id = $1`, [thread.id]);
    if (thread.document_type === 'inspection') {
      // Close the report directly rather than via updateInspectionReport:
      // that path fires the finalize -> auto-generate-quotation chain, which
      // would hand a rejecting customer a quotation they never asked for.
      await db.query(
        `UPDATE inspection_reports SET status = 'final', updated_at = NOW() WHERE id = $1 AND client_id = $2`,
        [thread.document_id, thread.client_id]
      );
    } else if (thread.document_type === 'quotation') {
      await db.query(`UPDATE quotations SET status = 'rejected', updated_at = NOW() WHERE id = $1`, [thread.document_id]);
    }
    if (thread.technician_whatsapp) {
      await sendText(thread.technician_whatsapp, `Customer rejected the ${thread.document_type}. Job stopped.`, { clientId: thread.client_id, threadId: thread.id });
    }
    return;
  }

  // Approved
  if (thread.document_type === 'inspection') {
    const updated = await updateInspectionReport(thread.client_id, thread.document_id, { status: 'final' });
    const quotation = updated.generated_quotation;
    if (!quotation) return; // already had a quotation — nothing new to send

    const jobResult = await db.query(`SELECT * FROM repair_jobs WHERE id = $1`, [thread.job_id]);
    const job = jobResult.rows[0];
    const customerResult = await db.query(`SELECT * FROM customers WHERE id = $1`, [job.customer_id]);
    const customer = customerResult.rows[0];

    const delivery = await sendQuotationToCustomer(client, customer, job, quotation, { clientId: thread.client_id });
    await db.query(
      `UPDATE whatsapp_job_threads SET stage = 'quotation_sent', document_type = 'quotation', document_id = $2, status = 'awaiting_customer', updated_at = NOW() WHERE id = $1`,
      [thread.id, quotation.id]
    );
    if (thread.technician_whatsapp) {
      await sendText(
        thread.technician_whatsapp,
        `Customer approved the inspection. Quotation ${quotation.quotation_number} sent automatically.${deliveryNote(delivery, customer.name)}`,
        { clientId: thread.client_id }
      );
    }
  } else if (thread.document_type === 'quotation') {
    await updateQuotation(thread.client_id, thread.document_id, { status: 'approved', approval_channel: 'whatsapp' });
    await db.query(`UPDATE whatsapp_job_threads SET stage = 'awaiting_completion', status = 'awaiting_technician', updated_at = NOW() WHERE id = $1`, [thread.id]);
    if (thread.technician_whatsapp) {
      await sendText(thread.technician_whatsapp, `Customer approved the quotation — go ahead with the repair. Send "DONE" when it's finished.`, { clientId: thread.client_id });
    }
  }
};

/**
 * Technician sends "DONE" once the repair is complete — closes out the
 * thread and applies the individual-vs-contractor invoice timing rule.
 */
const handleTechnicianDone = async (technician, from) => {
  const threadResult = await db.query(
    `SELECT * FROM whatsapp_job_threads WHERE technician_id = $1 AND status = 'awaiting_technician' ORDER BY updated_at DESC LIMIT 1`,
    [technician.id]
  );
  const thread = threadResult.rows[0];
  if (!thread) {
    await sendText(from, `No job is currently waiting on you to finish. If this is about a specific job, let me know the job number.`, { clientId: technician.client_id });
    return;
  }

  const client = await getClientById(thread.client_id);
  const jobResult = await db.query(`SELECT * FROM repair_jobs WHERE id = $1`, [thread.job_id]);
  const job = jobResult.rows[0];
  const customerResult = await db.query(`SELECT * FROM customers WHERE id = $1`, [job.customer_id]);
  const customer = customerResult.rows[0];

  const invoiceThread = await db.query(`SELECT invoice_id FROM invoice_jobs WHERE job_id = $1 LIMIT 1`, [job.id]);
  const invoiceId = invoiceThread.rows[0]?.invoice_id;
  const invoice = invoiceId ? (await getInvoice(thread.client_id, invoiceId)) : null;

  await db.query(`UPDATE repair_jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`, [job.id]);
  await db.query(`UPDATE whatsapp_job_threads SET status = 'closed', updated_at = NOW() WHERE id = $1`, [thread.id]);

  if (!invoice) {
    await sendText(from, `Marked the job complete. No invoice found yet for this job — check the Invoices page.`, { clientId: thread.client_id });
    return;
  }

  if (customer.billing_type === 'contractor') {
    await sendText(from, `Job marked complete. Invoice ${invoice.invoice_number} is queued — contractor invoices go out in a batch during the last 3 days of the month.`, { clientId: thread.client_id });
  } else {
    const delivery = await sendInvoiceToCustomer(client, customer, invoice, { clientId: thread.client_id });
    // Only mark it sent if it actually went out — otherwise the invoice looks
    // delivered in the UI while the customer never received anything.
    if (!delivery.hasWhatsapp || delivery.whatsappSent) {
      await db.query(`UPDATE invoices SET status = 'sent', sent_at = NOW() WHERE id = $1`, [invoice.id]);
    }
    await sendText(
      from,
      `Job marked complete. Invoice ${invoice.invoice_number} sent to ${customer.name}.${deliveryNote(delivery, customer.name)}`,
      { clientId: thread.client_id }
    );
  }
};

export { parseCommand, handleTechnicianMessage, handleCustomerReply };
