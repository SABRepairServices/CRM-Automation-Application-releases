import db, { withTransaction } from '../../config/database.js';

const listInvoices = async (clientId, filters = {}) => {
  let query = `
    SELECT DISTINCT i.*, c.name as customer_name, c.email as customer_email
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
  `;

  if (filters.job_id) {
    query += ` JOIN invoice_jobs ij ON ij.invoice_id = i.id AND ij.job_id = $2`;
  }

  query += ` WHERE i.client_id = $1`;

  const params = filters.job_id ? [clientId, filters.job_id] : [clientId];

  if (filters.status) {
    query += ` AND i.status = $${params.length + 1}`;
    params.push(filters.status);
  }

  query += ` ORDER BY i.created_at DESC LIMIT 100`;

  const result = await db.query(query, params);
  return result.rows;
};

const getInvoice = async (clientId, invoiceId) => {
  const result = await db.query(
    `SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
     FROM invoices i
     LEFT JOIN customers c ON i.customer_id = c.id
     WHERE i.id = $1 AND i.client_id = $2`,
    [invoiceId, clientId]
  );

  if (result.rows.length === 0) return null;

  const invoice = result.rows[0];

  const jobsResult = await db.query(
    `SELECT ij.*, rj.appliance_type, rj.reported_fault, rj.job_number
     FROM invoice_jobs ij
     LEFT JOIN repair_jobs rj ON ij.job_id = rj.id
     WHERE ij.invoice_id = $1`,
    [invoiceId]
  );

  invoice.jobs = jobsResult.rows;

  return invoice;
};

const createInvoice = async (clientId, data) => {
  const { customer_id, contract_id, issue_date, due_date, job_amounts = [], notes } = data;

  const subtotal = job_amounts.reduce((sum, j) => sum + j.amount, 0);
  const vatAmount = subtotal * 0.05;
  const totalAmount = subtotal + vatAmount;

  // Transactional: a job_id already linked to another invoice trips
  // invoice_jobs' UNIQUE(invoice_id, job_id) partway through the loop —
  // without this the header row commits regardless, orphaning an empty
  // invoice. Same bug class caught live in monthlyInvoiceService.
  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO invoices
         (client_id, customer_id, contract_id, subtotal, vat_amount, total_amount, status, issue_date, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9)
       RETURNING *`,
      [clientId, customer_id || null, contract_id || null, subtotal, vatAmount, totalAmount, issue_date || null, due_date || null, notes || '']
    );

    const invoice = result.rows[0];

    for (const { job_id, amount } of job_amounts) {
      await client.query(
        `INSERT INTO invoice_jobs (invoice_id, job_id, amount) VALUES ($1, $2, $3)`,
        [invoice.id, job_id, amount]
      );
    }

    return invoice;
  });
};

/**
 * Called automatically when a quotation's status flips to 'approved'.
 * Creates one invoice for that job's quotation total, unless the job
 * already has an invoice (idempotent — safe to call more than once).
 */
const generateInvoiceForApprovedQuotation = async (clientId, quotation) => {
  const alreadyInvoiced = await db.query(
    `SELECT invoice_id FROM invoice_jobs WHERE job_id = $1 LIMIT 1`,
    [quotation.job_id]
  );
  if (alreadyInvoiced.rows.length > 0) {
    return null;
  }

  const jobResult = await db.query(`SELECT customer_id FROM repair_jobs WHERE id = $1`, [quotation.job_id]);
  const customerId = jobResult.rows[0]?.customer_id || null;

  const subtotal = Number(quotation.labour_amount) + Number(quotation.parts_amount) - Number(quotation.discount_amount);
  const vatAmount = subtotal * (Number(quotation.vat_percent) / 100);
  const totalAmount = subtotal + vatAmount;

  const issueDate = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO invoices
         (client_id, customer_id, subtotal, vat_amount, total_amount, status, issue_date, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, $8)
       RETURNING *`,
      [clientId, customerId, subtotal, vatAmount, totalAmount, issueDate, dueDate, `Auto-generated from quotation ${quotation.quotation_number}`]
    );

    const invoice = result.rows[0];

    await client.query(
      `INSERT INTO invoice_jobs (invoice_id, job_id, amount) VALUES ($1, $2, $3)`,
      [invoice.id, quotation.job_id, subtotal]
    );

    return invoice;
  });
};

const updateInvoice = async (clientId, invoiceId, data) => {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
    if (data.status === 'sent') {
      updates.push(`sent_at = NOW()`);
    }
  }
  if (data.paid_amount !== undefined) {
    updates.push(`paid_amount = $${paramCount++}`);
    values.push(data.paid_amount);
  }
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(data.notes);
  }

  values.push(invoiceId, clientId);

  const result = await db.query(
    `UPDATE invoices SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount} AND client_id = $${paramCount + 1}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

const deleteInvoice = async (clientId, invoiceId) => {
  const result = await db.query(
    `UPDATE invoices SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND client_id = $2
     RETURNING *`,
    [invoiceId, clientId]
  );
  return result.rows[0];
};

const getInvoiceStats = async (clientId) => {
  const result = await db.query(
    `SELECT
      COUNT(*) as total_invoices,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_invoices,
      COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_invoices,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_paid
     FROM invoices
     WHERE client_id = $1`,
    [clientId]
  );

  return result.rows[0] || { total_invoices: 0, draft_invoices: 0, sent_invoices: 0, paid_invoices: 0, total_paid: 0 };
};

export {
  listInvoices,
  getInvoice,
  createInvoice,
  generateInvoiceForApprovedQuotation,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
};
