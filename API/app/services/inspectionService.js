import db, { withTransaction } from '../../config/database.js';
import { generateQuotationForFinalizedInspection } from './quotationService.js';
import { resolveCustomerAndJob } from './customerJobResolver.js';

const listInspectionReports = async (clientId, filters = {}) => {
  let query = `
    SELECT ir.*, rj.customer_id, c.name as customer_name, rj.appliance_type
    FROM inspection_reports ir
    LEFT JOIN repair_jobs rj ON ir.job_id = rj.id
    LEFT JOIN customers c ON rj.customer_id = c.id
    WHERE ir.client_id = $1
  `;
  const params = [clientId];

  if (filters.job_id) {
    query += ` AND ir.job_id = $${params.length + 1}`;
    params.push(filters.job_id);
  }

  query += ` ORDER BY ir.created_at DESC LIMIT 100`;

  const result = await db.query(query, params);
  return result.rows;
};

const getInspectionReport = async (clientId, reportId) => {
  const result = await db.query(
    `SELECT ir.*, rj.customer_id, rj.job_number, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address, rj.appliance_type
     FROM inspection_reports ir
     LEFT JOIN repair_jobs rj ON ir.job_id = rj.id
     LEFT JOIN customers c ON rj.customer_id = c.id
     WHERE ir.id = $1 AND ir.client_id = $2`,
    [reportId, clientId]
  );

  if (result.rows.length === 0) return null;
  const report = result.rows[0];

  const findingsResult = await db.query(
    `SELECT * FROM inspection_findings WHERE inspection_report_id = $1 ORDER BY sort_order ASC`,
    [reportId]
  );
  report.findings = findingsResult.rows;

  return report;
};

const createInspectionReport = async (clientId, data) => {
  const { inspected_by, findings = [], taxable_amount = 0, tax_rate = 5.0, notes, root_cause, technician_notes, diagnosis_result, signatures } = data;
  const inspected_at = data.inspected_at || new Date().toISOString().slice(0, 10);
  const taxAmount = Number(taxable_amount) * (Number(tax_rate) / 100);

  // Transactional — same reasoning as quotationService.createQuotation:
  // resolveCustomerAndJob's writes must roll back together with the
  // report/findings if anything downstream fails.
  return withTransaction(async (client) => {
    const { jobId } = await resolveCustomerAndJob(clientId, data, client);

    const result = await client.query(
      `INSERT INTO inspection_reports
         (client_id, job_id, inspected_by, inspected_at, taxable_amount, tax_rate, tax_amount, notes, status, root_cause, technician_notes, diagnosis_result, signatures)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10, $11, $12)
       RETURNING *`,
      [clientId, jobId, inspected_by || null, inspected_at || null, taxable_amount, tax_rate, taxAmount, notes || '', root_cause || null, technician_notes || null, diagnosis_result || null, JSON.stringify(signatures || {})]
    );

    const report = result.rows[0];

    let sortOrder = 0;
    for (const finding of findings) {
      if (!finding.description) continue;
      await client.query(
        `INSERT INTO inspection_findings (inspection_report_id, description, sort_order)
         VALUES ($1, $2, $3)`,
        [report.id, finding.description, sortOrder++]
      );
    }

    return report;
  });
};

const updateInspectionReport = async (clientId, reportId, data) => {
  const existing = await db.query(`SELECT * FROM inspection_reports WHERE id = $1 AND client_id = $2`, [reportId, clientId]);
  if (existing.rows.length === 0) return null;
  const before = existing.rows[0];

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
  }
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(data.notes);
  }
  if (data.inspected_by !== undefined) {
    updates.push(`inspected_by = $${paramCount++}`);
    values.push(data.inspected_by);
  }
  if (data.taxable_amount !== undefined) {
    const taxRate = data.tax_rate !== undefined ? data.tax_rate : 5.0;
    updates.push(`taxable_amount = $${paramCount++}`);
    values.push(data.taxable_amount);
    updates.push(`tax_amount = $${paramCount++}`);
    values.push(Number(data.taxable_amount) * (Number(taxRate) / 100));
  }
  if (data.tax_rate !== undefined) {
    updates.push(`tax_rate = $${paramCount++}`);
    values.push(data.tax_rate);
  }
  if (data.root_cause !== undefined) {
    updates.push(`root_cause = $${paramCount++}`);
    values.push(data.root_cause);
  }
  if (data.technician_notes !== undefined) {
    updates.push(`technician_notes = $${paramCount++}`);
    values.push(data.technician_notes);
  }
  if (data.diagnosis_result !== undefined) {
    updates.push(`diagnosis_result = $${paramCount++}`);
    values.push(data.diagnosis_result);
  }
  if (data.signatures !== undefined) {
    updates.push(`signatures = $${paramCount++}`);
    values.push(JSON.stringify(data.signatures));
  }

  values.push(reportId, clientId);

  const result = await db.query(
    `UPDATE inspection_reports SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount} AND client_id = $${paramCount + 1}
     RETURNING *`,
    values
  );

  const updated = result.rows[0];

  // Automation: marking an inspection completed auto-generates its
  // quotation, once. 'cannot_repair' is also a terminal state but does
  // NOT generate a quotation — there's nothing to quote.
  let generatedQuotation = null;
  if (before.status !== 'completed' && updated.status === 'completed') {
    generatedQuotation = await generateQuotationForFinalizedInspection(clientId, updated);
  }

  return { ...updated, generated_quotation: generatedQuotation };
};

const deleteInspectionReport = async (clientId, reportId) => {
  const result = await db.query(
    `DELETE FROM inspection_reports WHERE id = $1 AND client_id = $2 RETURNING id`,
    [reportId, clientId]
  );
  return result.rows[0];
};

export {
  listInspectionReports,
  getInspectionReport,
  createInspectionReport,
  updateInspectionReport,
  deleteInspectionReport,
};
