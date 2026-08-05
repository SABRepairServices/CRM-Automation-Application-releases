import { query } from './database.js';

/**
 * List all customers for a client
 */
export const listCustomers = async (clientId, filters = {}) => {
  let sql = `
    SELECT id, name, phone, whatsapp, email, area, address, source, status, billing_type, notes, created_at
    FROM customers
    WHERE client_id = $1
  `;
  const params = [clientId];

  if (filters.status) {
    sql += ` AND status = $${params.length + 1}`;
    params.push(filters.status);
  }

  if (filters.source) {
    sql += ` AND source = $${params.length + 1}`;
    params.push(filters.source);
  }

  sql += ` ORDER BY created_at DESC LIMIT 100`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get customer by ID
 */
export const getCustomer = async (customerId, clientId) => {
  const result = await query(
    `SELECT * FROM customers WHERE id = $1 AND client_id = $2`,
    [customerId, clientId]
  );
  return result.rows[0] || null;
};

/**
 * Create new customer (lead)
 */
export const createCustomer = async (clientId, data) => {
  const { name, phone, whatsapp, email, area, address, source, status, billing_type, notes } = data;

  if (!name || !phone) {
    throw new Error('Name and phone required');
  }

  const result = await query(
    `INSERT INTO customers (client_id, name, phone, whatsapp, email, area, address, source, status, billing_type, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [clientId, name, phone, whatsapp || null, email || null, area || null, address || null, source || 'unknown', status || 'new', billing_type || 'individual', notes || null]
  );

  return result.rows[0];
};

/**
 * Update customer
 */
export const updateCustomer = async (customerId, clientId, data) => {
  const customer = await getCustomer(customerId, clientId);
  if (!customer) throw new Error('Customer not found');

  const updates = [];
  const params = [];
  let paramNum = 1;

  const fields = ['name', 'phone', 'whatsapp', 'email', 'area', 'address', 'source', 'status', 'billing_type', 'notes'];
  fields.forEach(field => {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${paramNum++}`);
      params.push(data[field]);
    }
  });

  if (updates.length === 0) return customer;

  params.push(customerId, clientId);
  const sql = `
    UPDATE customers
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramNum} AND client_id = $${paramNum + 1}
    RETURNING *
  `;

  const result = await query(sql, params);
  return result.rows[0];
};

/**
 * Delete customer
 */
export const deleteCustomer = async (customerId, clientId) => {
  const customer = await getCustomer(customerId, clientId);
  if (!customer) throw new Error('Customer not found');

  await query(
    `DELETE FROM customers WHERE id = $1 AND client_id = $2`,
    [customerId, clientId]
  );

  return { success: true, id: customerId };
};

/**
 * Get customer statistics for client
 */
export const getCustomerStats = async (clientId) => {
  const result = await query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
       SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as booked_count,
       SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done_count,
       COUNT(DISTINCT source) as sources
     FROM customers
     WHERE client_id = $1`,
    [clientId]
  );

  return result.rows[0] || { total: 0, new_count: 0, booked_count: 0, done_count: 0, sources: 0 };
};

/**
 * Bulk import customers from array
 */
export const bulkCreateCustomers = async (clientId, customers) => {
  const results = [];

  for (const customer of customers) {
    try {
      const created = await createCustomer(clientId, customer);
      results.push({ success: true, id: created.id, name: created.name });
    } catch (error) {
      results.push({ success: false, error: error.message, data: customer });
    }
  }

  return results;
};
