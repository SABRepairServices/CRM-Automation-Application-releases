import { query } from './database.js';

/**
 * List all clients for a user
 */
export const listClients = async (userId) => {
  const result = await query(
    `SELECT id, name, business_type, industry, website, email, phone, city, country, is_active, subscription, created_at
     FROM clients
     WHERE user_id = $1 AND is_active = TRUE
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Get client by ID
 */
export const getClient = async (clientId, userId) => {
  const result = await query(
    `SELECT * FROM clients WHERE id = $1 AND user_id = $2`,
    [clientId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Create new client
 */
export const createClient = async (userId, data) => {
  const { name, business_type, industry, website, email, phone, address, city, country, logo_url, brand_color } = data;

  if (!name) {
    throw new Error('Client name required');
  }

  const result = await query(
    `INSERT INTO clients (user_id, name, business_type, industry, website, email, phone, address, city, country, logo_url, brand_color, subscription)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'free')
     RETURNING *`,
    [userId, name, business_type || null, industry || null, website || null, email || null, phone || null, address || null, city || null, country || null, logo_url || null, brand_color || null]
  );

  return result.rows[0];
};

/**
 * Update client
 */
export const updateClient = async (clientId, userId, data) => {
  const client = await getClient(clientId, userId);
  if (!client) throw new Error('Client not found');

  const updates = [];
  const params = [];
  let paramNum = 1;

  const fields = ['name', 'business_type', 'industry', 'website', 'email', 'phone', 'address', 'city', 'country', 'logo_url', 'brand_color', 'billing_email', 'notes', 'is_active'];
  fields.forEach(field => {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${paramNum++}`);
      params.push(data[field]);
    }
  });

  if (updates.length === 0) return client;

  params.push(clientId, userId);
  const sql = `
    UPDATE clients
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramNum} AND user_id = $${paramNum + 1}
    RETURNING *
  `;

  const result = await query(sql, params);
  return result.rows[0];
};

/**
 * Delete client (soft delete)
 */
export const deleteClient = async (clientId, userId) => {
  const client = await getClient(clientId, userId);
  if (!client) throw new Error('Client not found');

  await query(
    `UPDATE clients SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`,
    [clientId, userId]
  );

  return { success: true, id: clientId };
};

/**
 * Get client statistics
 */
export const getClientStats = async (clientId, userId) => {
  const result = await query(
    `SELECT
       c.id,
       c.name,
       COUNT(DISTINCT cu.id) as customer_count,
       COUNT(DISTINCT rj.id) as job_count,
       COUNT(DISTINCT sa.id) as social_accounts_count
     FROM clients c
     LEFT JOIN customers cu ON cu.client_id = c.id
     LEFT JOIN repair_jobs rj ON rj.client_id = c.id
     LEFT JOIN social_accounts sa ON sa.client_id = c.id
     WHERE c.id = $1 AND c.user_id = $2
     GROUP BY c.id, c.name`,
    [clientId, userId]
  );

  return result.rows[0] || { id: clientId, name: '', customer_count: 0, job_count: 0, social_accounts_count: 0 };
};
