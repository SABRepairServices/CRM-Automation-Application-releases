import db from '../../config/database.js';
import { getCustomer } from './customerService.js';
import { getQuotation } from './quotationService.js';
import { getInvoice } from './invoiceService.js';
import { getInspectionReport } from './inspectionService.js';
import { getMonthlyInvoice } from './monthlyInvoiceService.js';
import {
  getClientById,
  sendQuotationToCustomer,
  sendInvoiceToCustomer,
  sendInspectionToCustomer,
  sendMonthlyInvoiceToCustomer,
} from './whatsappBotService.js';

const getJobById = async (jobId) => {
  if (!jobId) return null;
  const result = await db.query(`SELECT * FROM repair_jobs WHERE id = $1`, [jobId]);
  return result.rows[0] || null;
};

/**
 * Manual "Send" button handlers for the web UI. These reuse the exact same
 * delivery path the bot already uses automatically (WhatsApp — free-form if
 * the customer messaged in the last 24h, an approved template otherwise —
 * plus email as a secondary channel) so a technician can push a document out
 * on demand instead of waiting for the automatic trigger, or re-send one
 * that needs a manual follow-up.
 */
const sendQuotationManually = async (clientId, quotationId) => {
  const client = await getClientById(clientId);
  const quotation = await getQuotation(clientId, quotationId);
  if (!client || !quotation) return { error: 'Quotation not found' };
  if (!quotation.customer_id) return { error: 'This quotation has no linked customer to send to' };

  const customer = await getCustomer(quotation.customer_id, clientId);
  if (!customer) return { error: 'Customer not found' };
  if (!customer.whatsapp && !customer.email) return { error: 'Customer has no WhatsApp number or email on file' };

  const job = await getJobById(quotation.job_id);
  return sendQuotationToCustomer(client, customer, job || {}, quotation, { clientId });
};

const sendInvoiceManually = async (clientId, invoiceId) => {
  const client = await getClientById(clientId);
  const invoice = await getInvoice(clientId, invoiceId);
  if (!client || !invoice) return { error: 'Invoice not found' };
  if (!invoice.customer_id) return { error: 'This invoice has no linked customer to send to' };

  const customer = await getCustomer(invoice.customer_id, clientId);
  if (!customer) return { error: 'Customer not found' };
  if (!customer.whatsapp && !customer.email) return { error: 'Customer has no WhatsApp number or email on file' };

  return sendInvoiceToCustomer(client, customer, invoice, { clientId });
};

const sendInspectionManually = async (clientId, reportId) => {
  const client = await getClientById(clientId);
  const report = await getInspectionReport(clientId, reportId);
  if (!client || !report) return { error: 'Inspection report not found' };
  if (!report.customer_id) return { error: 'This report has no linked customer to send to' };

  const customer = await getCustomer(report.customer_id, clientId);
  if (!customer) return { error: 'Customer not found' };
  if (!customer.whatsapp && !customer.email) return { error: 'Customer has no WhatsApp number or email on file' };

  const job = await getJobById(report.job_id);
  return sendInspectionToCustomer(client, customer, job || {}, report, { clientId });
};

const sendMonthlyInvoiceManually = async (clientId, invoiceId) => {
  const client = await getClientById(clientId);
  const invoice = await getMonthlyInvoice(clientId, invoiceId);
  if (!client || !invoice) return { error: 'Monthly invoice not found' };
  if (!invoice.customer_id) return { error: 'This monthly invoice has no linked customer to send to' };

  const customer = await getCustomer(invoice.customer_id, clientId);
  if (!customer) return { error: 'Customer not found' };
  if (!customer.whatsapp && !customer.email) return { error: 'Customer has no WhatsApp number or email on file' };

  return sendMonthlyInvoiceToCustomer(client, customer, invoice, { clientId });
};

export { sendQuotationManually, sendInvoiceManually, sendInspectionManually, sendMonthlyInvoiceManually };
