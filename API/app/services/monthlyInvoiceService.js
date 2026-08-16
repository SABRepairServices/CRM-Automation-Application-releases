import db, { withTransaction } from '../../config/database.js';

/**
 * Completed jobs for a contract/customer, in a given month, not already
 * billed on another monthly invoice — the picker list for building a new
 * monthly statement. Mirrors the shape of v_indent_sheet
 * (Database/migrations/002_repair_business.sql) but per-job rather than
 * pre-aggregated, since the office needs to pick individual jobs.
 */
const listAvailableJobs = async (clientId, { contract_id, customer_id, month, year }) => {
  const conditions = [`rj.client_id = $1`, `rj.status = 'completed'`, `rj.completed_at IS NOT NULL`,
    `EXTRACT(YEAR FROM rj.completed_at) = $2`, `EXTRACT(MONTH FROM rj.completed_at) = $3`,
    `NOT EXISTS (SELECT 1 FROM monthly_invoice_jobs mij WHERE mij.job_id = rj.id)`];
  const params = [clientId, year, month];

  if (contract_id) {
    params.push(contract_id);
    conditions.push(`rj.contract_id = $${params.length}`);
  }
  if (customer_id) {
    params.push(customer_id);
    conditions.push(`rj.customer_id = $${params.length}`);
  }

  const result = await db.query(
    `SELECT rj.id as job_id, rj.job_number, rj.completed_at, rj.appliance_type, rj.serial_number,
            rj.reported_fault, c.name as customer_name,
            COALESCE(q.total_amount, 0) as suggested_amount
     FROM repair_jobs rj
     LEFT JOIN customers c ON c.id = rj.customer_id
     LEFT JOIN quotations q ON q.job_id = rj.id AND q.status = 'approved'
     WHERE ${conditions.join(' AND ')}
     ORDER BY rj.completed_at ASC`,
    params
  );
  return result.rows;
};

const listMonthlyInvoices = async (clientId, filters = {}) => {
  let query = `
    SELECT mi.*, c.name as customer_name, ct.company_name as contract_name
    FROM monthly_invoices mi
    LEFT JOIN customers c ON mi.customer_id = c.id
    LEFT JOIN contracts ct ON mi.contract_id = ct.id
    WHERE mi.client_id = $1
  `;
  const params = [clientId];

  if (filters.status) {
    query += ` AND mi.status = $${params.length + 1}`;
    params.push(filters.status);
  }

  query += ` ORDER BY mi.year DESC, mi.month DESC, mi.created_at DESC LIMIT 100`;

  const result = await db.query(query, params);
  return result.rows;
};

const getMonthlyInvoice = async (clientId, invoiceId) => {
  const result = await db.query(
    `SELECT mi.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
            c.contact_person, c.address as customer_address, c.panel_account_number,
            ct.company_name as contract_name
     FROM monthly_invoices mi
     LEFT JOIN customers c ON mi.customer_id = c.id
     LEFT JOIN contracts ct ON mi.contract_id = ct.id
     WHERE mi.id = $1 AND mi.client_id = $2`,
    [invoiceId, clientId]
  );

  if (result.rows.length === 0) return null;
  const invoice = result.rows[0];

  const jobsResult = await db.query(
    `SELECT mij.*, rj.job_number, rj.completed_at, rj.appliance_type, rj.serial_number, rj.reported_fault
     FROM monthly_invoice_jobs mij
     LEFT JOIN repair_jobs rj ON mij.job_id = rj.id
     WHERE mij.monthly_invoice_id = $1
     ORDER BY rj.completed_at ASC`,
    [invoiceId]
  );
  invoice.jobs = jobsResult.rows;

  return invoice;
};

const createMonthlyInvoice = async (clientId, data) => {
  const { contract_id, customer_id, month, year, payment_terms, prepared_by, to_email, cc_email, notes, job_amounts = [] } = data;

  if (!month || !year) {
    throw new Error('month and year are required');
  }

  const subtotal = job_amounts.reduce((sum, j) => sum + Number(j.amount || 0), 0);
  const totalReceived = job_amounts.reduce((sum, j) => sum + Number(j.received_amount || 0), 0);
  const totalPending = Math.max(0, subtotal - totalReceived);

  // Transactional: a job already billed on another statement trips the
  // UNIQUE on monthly_invoice_jobs.job_id partway through the loop below.
  // Without a transaction that left the header row committed with none of
  // its job lines — an orphaned empty invoice — caught by live testing.
  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO monthly_invoices
         (client_id, contract_id, customer_id, month, year, payment_terms, prepared_by, to_email, cc_email, subtotal, total_received, total_pending, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', $13)
       RETURNING *`,
      [clientId, contract_id || null, customer_id || null, month, year, payment_terms || 'due_on_receipt', prepared_by || null, to_email || null, cc_email || null, subtotal, totalReceived, totalPending, notes || '']
    );

    const invoice = result.rows[0];

    for (const { job_id, amount, received_amount } of job_amounts) {
      await client.query(
        `INSERT INTO monthly_invoice_jobs (monthly_invoice_id, job_id, amount, received_amount) VALUES ($1, $2, $3, $4)`,
        [invoice.id, job_id, amount || 0, received_amount || 0]
      );
    }

    return invoice;
  });
};

const updateMonthlyInvoice = async (clientId, invoiceId, data) => {
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
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(data.notes);
  }
  if (data.signatures !== undefined) {
    updates.push(`signatures = $${paramCount++}`);
    values.push(JSON.stringify(data.signatures));
  }
  if (data.prepared_by !== undefined) {
    updates.push(`prepared_by = $${paramCount++}`);
    values.push(data.prepared_by);
  }

  values.push(invoiceId, clientId);

  const result = await db.query(
    `UPDATE monthly_invoices SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount} AND client_id = $${paramCount + 1}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

const deleteMonthlyInvoice = async (clientId, invoiceId) => {
  // Hard delete (unlike per-job invoices' soft-cancel) — monthly_invoice_jobs
  // cascades, freeing those jobs back up for the next statement. Draft-only
  // deletion is enforced at the route layer.
  const result = await db.query(
    `DELETE FROM monthly_invoices WHERE id = $1 AND client_id = $2 RETURNING id`,
    [invoiceId, clientId]
  );
  return result.rows[0];
};

export {
  listAvailableJobs,
  listMonthlyInvoices,
  getMonthlyInvoice,
  createMonthlyInvoice,
  updateMonthlyInvoice,
  deleteMonthlyInvoice,
};
