import { query } from './database.js';
import { encrypt } from './cryptoService.js';

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

  const fields = ['name', 'business_type', 'industry', 'website', 'email', 'phone', 'address', 'city', 'country', 'logo_url', 'brand_color', 'billing_email', 'notes', 'is_active', 'vat_number'];
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

/**
 * Save or clear a client's WhatsApp Business credentials.
 * Pass token='' and phoneNumberId='' to disconnect (nulls out all 4 columns).
 * Token is stored AES-256-GCM encrypted — never in plaintext.
 */
export const updateWhatsappCredentials = async (clientId, userId, { token, phoneNumberId, displayNumber }) => {
  await getClient(clientId, userId); // ownership check — throws if not found

  if (!token && !phoneNumberId) {
    await query(
      `UPDATE clients
         SET whatsapp_token_encrypted = NULL,
             whatsapp_phone_number_id  = NULL,
             whatsapp_display_number   = NULL,
             whatsapp_connected_at     = NULL
       WHERE id = $1`,
      [clientId]
    );
    return { connected: false };
  }

  const encryptedToken = encrypt(token);
  await query(
    `UPDATE clients
       SET whatsapp_token_encrypted = $1,
           whatsapp_phone_number_id  = $2,
           whatsapp_display_number   = $3,
           whatsapp_connected_at     = NOW()
     WHERE id = $4`,
    [encryptedToken, phoneNumberId, displayNumber || null, clientId]
  );
  return { connected: true, phoneNumberId, displayNumber };
};

/**
 * Returns the WhatsApp connection status for a client (no token in plaintext).
 */
export const getWhatsappStatus = async (clientId, userId) => {
  await getClient(clientId, userId); // ownership check
  const result = await query(
    `SELECT whatsapp_phone_number_id, whatsapp_display_number, whatsapp_connected_at
       FROM clients WHERE id = $1`,
    [clientId]
  );
  const row = result.rows[0];
  return {
    connected: Boolean(row?.whatsapp_phone_number_id),
    phoneNumberId: row?.whatsapp_phone_number_id || null,
    displayNumber: row?.whatsapp_display_number || null,
    connectedAt: row?.whatsapp_connected_at || null,
  };
};
