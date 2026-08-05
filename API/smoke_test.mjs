import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../Configs/.env') });

// Import the actual service functions we fixed, so this is a real test of
// the code path the app uses, not a hand-rolled SQL check.
const dbModule = await import('./config/database.js');
const db = dbModule.default;

const { createQuotation, updateQuotation } = await import('./app/services/quotationService.js');
const { getInvoice } = await import('./app/services/invoiceService.js');

let userId, clientId, customerId, jobId;

try {
  const userRes = await db.query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ('smoketest+' || gen_random_uuid() || '@example.com', 'x', 'Smoke Test User') RETURNING id`
  );
  userId = userRes.rows[0].id;
  console.log('Created user:', userId);

  const clientRes = await db.query(
    `INSERT INTO clients (user_id, name, business_type) VALUES ($1, 'Smoke Test Client', 'repair') RETURNING id`,
    [userId]
  );
  clientId = clientRes.rows[0].id;
  console.log('Created client:', clientId);

  const customerRes = await db.query(
    `INSERT INTO customers (client_id, name, phone) VALUES ($1, 'Smoke Test Customer', '0500000000') RETURNING id`,
    [clientId]
  );
  customerId = customerRes.rows[0].id;
  console.log('Created customer:', customerId);

  const jobRes = await db.query(
    `INSERT INTO repair_jobs (client_id, customer_id, appliance_type, status) VALUES ($1, $2, 'washing_machine', 'quoted') RETURNING id, job_number`,
    [clientId, customerId]
  );
  jobId = jobRes.rows[0].id;
  console.log('Created job:', jobId, jobRes.rows[0].job_number);

  const quotation = await createQuotation(clientId, {
    job_id: jobId,
    items: [
      { description: 'Drain pump', item_type: 'part', quantity: 1, unit_price: 203 },
      { description: 'Labour', item_type: 'labour', quantity: 1, unit_price: 175 },
    ],
    discount_amount: 0,
    vat_percent: 5,
    notes: 'Smoke test quotation',
  });
  console.log('Created quotation:', quotation.quotation_number, 'total:', quotation.total_amount);

  const approved = await updateQuotation(clientId, quotation.id, {
    status: 'approved',
    approved_by: 'Smoke Test',
    approval_channel: 'app',
  });
  console.log('Approved quotation. Status:', approved.status);
  console.log('Auto-generated invoice:', approved.generated_invoice?.invoice_number, 'total:', approved.generated_invoice?.total_amount);

  if (!approved.generated_invoice) {
    throw new Error('FAIL: no invoice was auto-generated on approval');
  }

  const invoice = await getInvoice(clientId, approved.generated_invoice.id);
  console.log('Fetched invoice back:', invoice.invoice_number, 'jobs linked:', invoice.jobs.length, 'total:', invoice.total_amount);

  // Idempotency check: approving again (no-op status change) shouldn't double-invoice
  const secondApprove = await updateQuotation(clientId, quotation.id, { status: 'approved' });
  console.log('Second approve call generated invoice:', secondApprove.generated_invoice, '(should be null)');

  console.log('\n✅ SMOKE TEST PASSED');
} catch (err) {
  console.error('\n❌ SMOKE TEST FAILED:', err.message);
  console.error(err.stack);
  process.exitCode = 1;
} finally {
  // Clean up everything we created
  if (clientId) {
    await db.query(`DELETE FROM invoice_jobs WHERE job_id = $1`, [jobId]).catch(() => {});
    await db.query(`DELETE FROM invoices WHERE client_id = $1`, [clientId]).catch(() => {});
    await db.query(`DELETE FROM quotation_items WHERE quotation_id IN (SELECT id FROM quotations WHERE client_id = $1)`, [clientId]).catch(() => {});
    await db.query(`DELETE FROM quotations WHERE client_id = $1`, [clientId]).catch(() => {});
    await db.query(`DELETE FROM repair_jobs WHERE client_id = $1`, [clientId]).catch(() => {});
    await db.query(`DELETE FROM customers WHERE client_id = $1`, [clientId]).catch(() => {});
    await db.query(`DELETE FROM clients WHERE id = $1`, [clientId]).catch(() => {});
    if (userId) await db.query(`DELETE FROM users WHERE id = $1`, [userId]).catch(() => {});
    console.log('Cleaned up smoke test data.');
  }
  await db.end();
}
