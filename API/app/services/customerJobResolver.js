import db from '../../config/database.js';

/**
 * Quotations and inspection reports both require a real repair_jobs row
 * (job_id is NOT NULL on both tables) — but the redesigned create forms
 * let the office type customer + appliance details straight into the
 * document, with no separate "select a job" step, matching how the office
 * actually thinks about it (one form, not two). This resolves that gap:
 * given either an existing job_id, or a customer+appliance payload, it
 * returns a real {customer_id, job_id} to insert the document against —
 * finding the customer by phone if one already exists, and creating a
 * fresh repair_jobs row otherwise.
 *
 * This silently replaces what used to be a straight pass-through of a
 * (frequently undefined) job_id, which was violating repair_jobs'/
 * quotations'/inspection_reports' NOT NULL constraints in production.
 */
const resolveCustomerAndJob = async (clientId, data) => {
  if (data.job_id) {
    const existing = await db.query(
      `SELECT id, customer_id FROM repair_jobs WHERE id = $1`,
      [data.job_id]
    );
    if (existing.rows.length === 0) {
      throw new Error('job_id does not exist');
    }
    return { customerId: existing.rows[0].customer_id, jobId: existing.rows[0].id };
  }

  const {
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    customer_building,
    customer_contact_person,
    customer_location,
    appliance_type,
    brand,
    model,
    serial_number,
    reported_fault,
    urgency,
    technician_id,
  } = data;

  if (!customer_name || !customer_phone) {
    throw new Error('customer_name and customer_phone are required to create a new job');
  }

  let customerId;
  const existingCustomer = await db.query(
    `SELECT id FROM customers WHERE client_id = $1 AND phone = $2 LIMIT 1`,
    [clientId, customer_phone]
  );

  if (existingCustomer.rows.length > 0) {
    customerId = existingCustomer.rows[0].id;
    // Backfill any newly-supplied office-facing fields onto the existing
    // customer record without clobbering values already on file.
    await db.query(
      `UPDATE customers SET
         name = COALESCE(NULLIF($2, ''), name),
         email = COALESCE(NULLIF($3, ''), email),
         address = COALESCE(NULLIF($4, ''), address),
         building_number = COALESCE(NULLIF($5, ''), building_number),
         contact_person = COALESCE(NULLIF($6, ''), contact_person),
         location_landmark = COALESCE(NULLIF($7, ''), location_landmark),
         updated_at = NOW()
       WHERE id = $1`,
      [customerId, customer_name, customer_email, customer_address, customer_building, customer_contact_person, customer_location]
    );
  } else {
    const created = await db.query(
      `INSERT INTO customers
         (client_id, name, phone, email, address, building_number, contact_person, location_landmark, source, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'walk_in', 'active')
       RETURNING id`,
      [clientId, customer_name, customer_phone, customer_email || null, customer_address || null, customer_building || null, customer_contact_person || null, customer_location || null]
    );
    customerId = created.rows[0].id;
  }

  const jobResult = await db.query(
    `INSERT INTO repair_jobs
       (client_id, customer_id, technician_id, appliance_type, brand, model, serial_number, reported_fault, priority, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')
     RETURNING id, customer_id`,
    [clientId, customerId, technician_id || null, appliance_type || null, brand || null, model || null, serial_number || null, reported_fault || null, urgency || 'normal']
  );

  return { customerId, jobId: jobResult.rows[0].id };
};

export { resolveCustomerAndJob };
