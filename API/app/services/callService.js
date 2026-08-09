import db from '../../config/database.js';

const listCalls = async (clientId, filters = {}) => {
  let query = `
    SELECT c.*, cu.name as customer_name, cu.phone as customer_phone, t.name as technician_name
    FROM calls c
    LEFT JOIN customers cu ON c.customer_id = cu.id
    LEFT JOIN technicians t ON c.technician_id = t.id
    WHERE c.client_id = $1
  `;
  const params = [clientId];

  if (filters.customer_id) {
    query += ` AND c.customer_id = $${params.length + 1}`;
    params.push(filters.customer_id);
  }
  if (filters.job_id) {
    query += ` AND c.job_id = $${params.length + 1}`;
    params.push(filters.job_id);
  }

  query += ` ORDER BY c.called_at DESC LIMIT 200`;

  const result = await db.query(query, params);
  return result.rows;
};

const getCall = async (clientId, callId) => {
  const result = await db.query(
    `SELECT c.*, cu.name as customer_name, cu.phone as customer_phone, t.name as technician_name
     FROM calls c
     LEFT JOIN customers cu ON c.customer_id = cu.id
     LEFT JOIN technicians t ON c.technician_id = t.id
     WHERE c.id = $1 AND c.client_id = $2`,
    [callId, clientId]
  );
  return result.rows[0] || null;
};

const createCall = async (clientId, data) => {
  const { customer_id, job_id, technician_id, direction, purpose, notes, duration_minutes, called_at } = data;

  if (!customer_id) throw new Error('customer_id is required');
  if (!direction) throw new Error('direction is required (inbound or outbound)');

  const result = await db.query(
    `INSERT INTO calls (client_id, customer_id, job_id, technician_id, direction, purpose, notes, duration_minutes, called_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()))
     RETURNING id`,
    [clientId, customer_id, job_id || null, technician_id || null, direction, purpose || 'other', notes || null, duration_minutes || null, called_at || null]
  );
  // Re-fetch with the customer/technician name JOINs so the frontend never
  // has to guess or refetch separately — same shape as list/get everywhere.
  return getCall(clientId, result.rows[0].id);
};

const updateCall = async (clientId, callId, data) => {
  const updates = [];
  const values = [];
  let paramCount = 1;

  const fields = ['direction', 'purpose', 'notes', 'duration_minutes', 'called_at', 'job_id', 'technician_id'];
  fields.forEach((field) => {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${paramCount++}`);
      values.push(data[field]);
    }
  });

  if (updates.length === 0) return getCall(clientId, callId);

  values.push(callId, clientId);
  await db.query(
    `UPDATE calls SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount} AND client_id = $${paramCount + 1}`,
    values
  );
  return getCall(clientId, callId);
};

const deleteCall = async (clientId, callId) => {
  const result = await db.query(`DELETE FROM calls WHERE id = $1 AND client_id = $2 RETURNING id`, [callId, clientId]);
  return result.rows[0];
};

const getCallStats = async (clientId) => {
  const result = await db.query(
    `SELECT
       COUNT(*) as total,
       COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_count,
       COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_count,
       COUNT(CASE WHEN called_at >= CURRENT_DATE THEN 1 END) as today_count
     FROM calls
     WHERE client_id = $1`,
    [clientId]
  );
  return result.rows[0];
};

export { listCalls, getCall, createCall, updateCall, deleteCall, getCallStats };
