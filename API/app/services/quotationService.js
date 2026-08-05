import db from '../../config/database.js';
import { generateInvoiceForApprovedQuotation } from './invoiceService.js';

const listQuotations = async (clientId, filters = {}) => {
  let query = `
    SELECT q.*, rj.customer_id, c.name as customer_name, rj.appliance_type, rj.reported_fault
    FROM quotations q
    LEFT JOIN repair_jobs rj ON q.job_id = rj.id
    LEFT JOIN customers c ON rj.customer_id = c.id
    WHERE q.client_id = $1
  `;

  const params = [clientId];

  if (filters.status) {
    query += ` AND q.status = $${params.length + 1}`;
    params.push(filters.status);
  }

  if (filters.job_id) {
    query += ` AND q.job_id = $${params.length + 1}`;
    params.push(filters.job_id);
  }

  query += ` ORDER BY q.created_at DESC LIMIT 100`;

  const result = await db.query(query, params);
  return result.rows;
};

const getQuotation = async (clientId, quotationId) => {
  const result = await db.query(
    `SELECT q.*, rj.customer_id, rj.job_number, rj.appliance_type, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
     FROM quotations q
     LEFT JOIN repair_jobs rj ON q.job_id = rj.id
     LEFT JOIN customers c ON rj.customer_id = c.id
     WHERE q.id = $1 AND q.client_id = $2`,
    [quotationId, clientId]
  );

  if (result.rows.length === 0) return null;

  const quotation = result.rows[0];

  const itemsResult = await db.query(
    `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order ASC`,
    [quotationId]
  );

  quotation.items = itemsResult.rows;
  return quotation;
};

const computeTotals = (items, discountAmount, vatPercent) => {
  const labourAmount = items
    .filter((i) => i.item_type === 'labour')
    .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const partsAmount = items
    .filter((i) => i.item_type !== 'labour')
    .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const subtotal = labourAmount + partsAmount - (discountAmount || 0);
  const totalAmount = subtotal * (1 + (vatPercent || 0) / 100);
  return { labourAmount, partsAmount, totalAmount };
};

const createQuotation = async (clientId, data) => {
  const { job_id, items = [], discount_amount = 0, vat_percent = 5.0, valid_until, notes } = data;

  const { labourAmount, partsAmount, totalAmount } = computeTotals(items, discount_amount, vat_percent);

  const result = await db.query(
    `INSERT INTO quotations
       (client_id, job_id, labour_amount, parts_amount, discount_amount, vat_percent, total_amount, status, valid_until, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $9)
     RETURNING *`,
    [clientId, job_id, labourAmount, partsAmount, discount_amount, vat_percent, totalAmount, valid_until || null, notes || '']
  );

  const quotation = result.rows[0];

  let sortOrder = 0;
  for (const item of items) {
    const lineTotal = item.quantity * item.unit_price;
    await db.query(
      `INSERT INTO quotation_items (quotation_id, description, item_type, quantity, unit_price, line_total, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [quotation.id, item.description, item.item_type || 'part', item.quantity, item.unit_price, lineTotal, sortOrder++]
    );
  }

  return quotation;
};

/**
 * Called automatically when an inspection report's status flips to 'final'.
 * Creates one quotation for that job from the inspection's taxable amount,
 * unless the job already has a quotation (idempotent — safe to call more than once).
 */
const generateQuotationForFinalizedInspection = async (clientId, report) => {
  const alreadyQuoted = await db.query(
    `SELECT id FROM quotations WHERE job_id = $1 LIMIT 1`,
    [report.job_id]
  );
  if (alreadyQuoted.rows.length > 0) {
    return null;
  }

  const labourAmount = Number(report.taxable_amount);
  const partsAmount = 0;
  const discountAmount = 0;
  const vatPercent = Number(report.tax_rate);
  const totalAmount = labourAmount + Number(report.tax_amount);

  const result = await db.query(
    `INSERT INTO quotations
       (client_id, job_id, labour_amount, parts_amount, discount_amount, vat_percent, total_amount, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8)
     RETURNING *`,
    [clientId, report.job_id, labourAmount, partsAmount, discountAmount, vatPercent, totalAmount, `Auto-generated from inspection report ${report.report_number}`]
  );

  const quotation = result.rows[0];

  const findingsResult = await db.query(
    `SELECT description FROM inspection_findings WHERE inspection_report_id = $1 ORDER BY sort_order ASC`,
    [report.id]
  );
  const description = findingsResult.rows.length > 0
    ? findingsResult.rows.map((f) => f.description).join('; ')
    : 'Inspection & Diagnosis';

  await db.query(
    `INSERT INTO quotation_items (quotation_id, description, item_type, quantity, unit_price, line_total, sort_order)
     VALUES ($1, $2, 'labour', 1, $3, $3, 0)`,
    [quotation.id, description, labourAmount]
  );

  return quotation;
};

const updateQuotation = async (clientId, quotationId, data) => {
  const existing = await db.query(`SELECT * FROM quotations WHERE id = $1 AND client_id = $2`, [quotationId, clientId]);
  if (existing.rows.length === 0) return null;
  const before = existing.rows[0];

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
    if (data.status === 'approved') {
      updates.push(`responded_at = NOW()`);
      if (data.approved_by !== undefined) {
        updates.push(`approved_by = $${paramCount++}`);
        values.push(data.approved_by);
      }
      if (data.approval_channel !== undefined) {
        updates.push(`approval_channel = $${paramCount++}`);
        values.push(data.approval_channel);
      }
    }
  }
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(data.notes);
  }
  if (data.valid_until !== undefined) {
    updates.push(`valid_until = $${paramCount++}`);
    values.push(data.valid_until);
  }

  values.push(quotationId, clientId);

  const result = await db.query(
    `UPDATE quotations SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount} AND client_id = $${paramCount + 1}
     RETURNING *`,
    values
  );

  const updated = result.rows[0];

  // Automation: approving a quotation auto-generates its invoice, once.
  let generatedInvoice = null;
  if (before.status !== 'approved' && updated.status === 'approved') {
    generatedInvoice = await generateInvoiceForApprovedQuotation(clientId, updated);
  }

  return { ...updated, generated_invoice: generatedInvoice };
};

const deleteQuotation = async (clientId, quotationId) => {
  const result = await db.query(
    `UPDATE quotations SET status = 'expired', updated_at = NOW()
     WHERE id = $1 AND client_id = $2
     RETURNING *`,
    [quotationId, clientId]
  );
  return result.rows[0];
};

const getQuotationStats = async (clientId) => {
  const result = await db.query(
    `SELECT
      COUNT(*) as total_quotations,
      COUNT(CASE WHEN status IN ('draft','sent') THEN 1 END) as pending_quotations,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_quotations,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END), 0) as approved_total
     FROM quotations
     WHERE client_id = $1`,
    [clientId]
  );

  return result.rows[0] || { total_quotations: 0, pending_quotations: 0, approved_quotations: 0, approved_total: 0 };
};

export {
  listQuotations,
  getQuotation,
  createQuotation,
  generateQuotationForFinalizedInspection,
  updateQuotation,
  deleteQuotation,
  getQuotationStats,
};
