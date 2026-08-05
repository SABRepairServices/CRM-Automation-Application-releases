import db from '../../config/database.js';

const listJobs = async (clientId, filters = {}) => {
  let query = `
    SELECT rj.*, c.name as customer_name, c.phone as customer_phone,
           count(jp.id) as photo_count
    FROM repair_jobs rj
    LEFT JOIN customers c ON rj.customer_id = c.id
    LEFT JOIN job_photos jp ON rj.id = jp.job_id
    WHERE rj.client_id = $1 AND rj.is_active = true
  `;

  const params = [clientId];

  if (filters.status) {
    query += ` AND rj.status = $${params.length + 1}`;
    params.push(filters.status);
  }

  if (filters.technician_id) {
    query += ` AND rj.technician_id = $${params.length + 1}`;
    params.push(filters.technician_id);
  }

  if (filters.customer_id) {
    query += ` AND rj.customer_id = $${params.length + 1}`;
    params.push(filters.customer_id);
  }

  query += ` GROUP BY rj.id, c.id ORDER BY rj.created_at DESC LIMIT 100`;

  const result = await db.query(query, params);
  return result.rows;
};

const getJob = async (clientId, jobId) => {
  const result = await db.query(
    `SELECT rj.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
            t.name as technician_name
     FROM repair_jobs rj
     LEFT JOIN customers c ON rj.customer_id = c.id
     LEFT JOIN technicians t ON rj.technician_id = t.id
     WHERE rj.id = $1 AND rj.client_id = $2`,
    [jobId, clientId]
  );
  return result.rows[0] || null;
};

const createJob = async (clientId, data) => {
  const { customer_id, appliance_type, brand, model, serial_number, reported_fault, scheduled_at } = data;

  const result = await db.query(
    `INSERT INTO repair_jobs
       (client_id, customer_id, appliance_type, brand, model, serial_number, reported_fault, scheduled_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new')
     RETURNING *`,
    [clientId, customer_id, appliance_type || null, brand || null, model || null, serial_number || null, reported_fault || null, scheduled_at || null]
  );

  return result.rows[0];
};

const updateJob = async (clientId, jobId, data) => {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
    if (data.status === 'completed') {
      updates.push(`completed_at = NOW()`);
    } else if (data.status === 'in_progress' || data.status === 'scheduled') {
      updates.push(`visited_at = COALESCE(visited_at, NOW())`);
    }
  }
  if (data.technician_id !== undefined) {
    updates.push(`technician_id = $${paramCount++}`);
    values.push(data.technician_id);
  }
  if (data.diagnosis !== undefined) {
    updates.push(`diagnosis = $${paramCount++}`);
    values.push(data.diagnosis);
  }
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(data.notes);
  }

  values.push(jobId, clientId);

  const result = await db.query(
    `UPDATE repair_jobs SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount} AND client_id = $${paramCount + 1}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

const deleteJob = async (clientId, jobId) => {
  const result = await db.query(
    `UPDATE repair_jobs SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND client_id = $2
     RETURNING *`,
    [jobId, clientId]
  );
  return result.rows[0];
};

const getJobStats = async (clientId) => {
  const result = await db.query(
    `SELECT
      COUNT(*) as total_jobs,
      COUNT(CASE WHEN status = 'new' THEN 1 END) as new_jobs,
      COUNT(CASE WHEN status IN ('scheduled', 'inspected', 'quoted') THEN 1 END) as pending_jobs,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs
     FROM repair_jobs
     WHERE client_id = $1 AND is_active = true`,
    [clientId]
  );

  return result.rows[0] || { total_jobs: 0, new_jobs: 0, pending_jobs: 0, completed_jobs: 0 };
};

export { listJobs, getJob, createJob, updateJob, deleteJob, getJobStats };
