import db from '../../config/database.js';

const listTechnicians = async (clientId) => {
  const result = await db.query(
    `SELECT * FROM technicians
     WHERE client_id = $1 AND is_active = true
     ORDER BY name ASC`,
    [clientId]
  );
  return result.rows;
};

const getTechnician = async (clientId, technicianId) => {
  const result = await db.query(
    `SELECT * FROM technicians WHERE id = $1 AND client_id = $2`,
    [technicianId, clientId]
  );
  return result.rows[0] || null;
};

const createTechnician = async (clientId, data) => {
  const { name, phone, email, speciality } = data;
  const result = await db.query(
    `INSERT INTO technicians (client_id, name, phone, email, speciality)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [clientId, name, phone || null, email || null, speciality || null]
  );
  return result.rows[0];
};

const updateTechnician = async (clientId, technicianId, data) => {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.phone !== undefined) {
    updates.push(`phone = $${paramCount++}`);
    values.push(data.phone);
  }
  if (data.email !== undefined) {
    updates.push(`email = $${paramCount++}`);
    values.push(data.email);
  }
  if (data.speciality !== undefined) {
    updates.push(`speciality = $${paramCount++}`);
    values.push(data.speciality);
  }

  values.push(technicianId, clientId);

  const result = await db.query(
    `UPDATE technicians SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount} AND client_id = $${paramCount + 1}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

const deleteTechnician = async (clientId, technicianId) => {
  const result = await db.query(
    `UPDATE technicians SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND client_id = $2
     RETURNING *`,
    [technicianId, clientId]
  );
  return result.rows[0];
};

export { listTechnicians, getTechnician, createTechnician, updateTechnician, deleteTechnician };
