import db from '../../config/database.js';

/**
 * Every data route (customers, jobs, quotations, invoices, technicians,
 * social accounts, posts) takes a client_id from the query string or
 * body and trusts it blindly — meaning any authenticated user could
 * pass ANY client_id and read/write another tenant's data. This
 * middleware closes that gap: it confirms req.user (set by
 * middleware/auth.js) actually owns the client_id being requested.
 *
 * Must run AFTER authenticate.
 */
const verifyClientAccess = async (req, res, next) => {
  const clientId = req.query.client_id || req.body.client_id;

  if (!clientId) {
    return res.status(400).json({ error: 'client_id required' });
  }

  try {
    const result = await db.query(
      `SELECT id FROM clients WHERE id = $1 AND user_id = $2`,
      [clientId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have access to this client' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default verifyClientAccess;
