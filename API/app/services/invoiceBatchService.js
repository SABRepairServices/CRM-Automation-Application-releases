import db from '../../config/database.js';
import { sendPdfEmail } from './emailService.js';
import { sendDocument } from './whatsappService.js';
import { generateInvoicePdf } from './pdfService.js';
import { getInvoice } from './invoiceService.js';

const isWithinLastThreeDaysOfMonth = (date) => {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return date.getDate() >= daysInMonth - 2;
};

/**
 * Sends every still-draft invoice belonging to a "contractor" customer.
 * Individual customers are invoiced immediately elsewhere (see
 * whatsappBotService.handleTechnicianDone) — this only covers the
 * held/batched contractor path. Meant to run once a day; only actually
 * sends anything during the last 3 days of the month.
 */
const runMonthEndContractorBatch = async (now) => {
  if (!isWithinLastThreeDaysOfMonth(now)) {
    return { ran: false, reason: 'not in month-end window' };
  }

  const pending = await db.query(
    `SELECT i.id as invoice_id, i.client_id, c.id as customer_id
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     WHERE i.status = 'draft' AND c.billing_type = 'contractor'`
  );

  let sent = 0;
  let failed = 0;
  for (const row of pending.rows) {
    try {
      const clientResult = await db.query(`SELECT * FROM clients WHERE id = $1`, [row.client_id]);
      const client = clientResult.rows[0];
      const customerResult = await db.query(`SELECT * FROM customers WHERE id = $1`, [row.customer_id]);
      const customer = customerResult.rows[0];
      const invoice = await getInvoice(row.client_id, row.invoice_id);

      const pdf = await generateInvoicePdf({ client, invoice, customerName: customer.name, customerPhone: customer.phone });
      const filename = `Invoice_${invoice.invoice_number}.pdf`;

      let delivered = false;
      if (customer.whatsapp) {
        const result = await sendDocument(
          customer.whatsapp,
          { buffer: pdf, filename, caption: `Monthly invoice ${invoice.invoice_number} — total ${Number(invoice.total_amount).toFixed(2)} AED.` },
          { clientId: row.client_id }
        );
        delivered = Boolean(result?.ok);
        if (!delivered) {
          console.error(`[InvoiceBatch] WhatsApp refused invoice ${invoice.invoice_number}:`, result?.error);
        }
      }

      // Email is secondary — its failure must not stop the invoice being
      // marked sent when WhatsApp already delivered it.
      if (customer.email) {
        try {
          await sendPdfEmail({ to: customer.email, subject: `Invoice ${invoice.invoice_number}`, text: 'Please find your monthly invoice attached.', filename, pdfBuffer: pdf });
          delivered = true;
        } catch (err) {
          console.error(`[InvoiceBatch] email failed for invoice ${invoice.invoice_number}:`, err.message);
        }
      }

      // Leaving it 'draft' when nothing got through means the next daily run
      // retries it, instead of silently writing off an unsent invoice.
      if (delivered) {
        await db.query(`UPDATE invoices SET status = 'sent', sent_at = NOW() WHERE id = $1`, [row.invoice_id]);
        sent += 1;
      } else {
        failed += 1;
      }
    } catch (err) {
      failed += 1;
      console.error(`[InvoiceBatch] failed to send invoice ${row.invoice_id}:`, err.message);
    }
  }

  return { ran: true, sent, failed, total: pending.rows.length };
};

export { runMonthEndContractorBatch, isWithinLastThreeDaysOfMonth };
