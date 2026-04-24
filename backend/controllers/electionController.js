const db = require('../db/connection');

const getAllElections = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, a.full_name as admin_name, a.email as admin_email
       FROM Elections e
       JOIN Admin_Users a ON e.admin_id = a.admin_id
       WHERE e.is_active = TRUE
       ORDER BY e.start_time DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getElectionById = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, a.full_name as admin_name, a.email as admin_email
       FROM Elections e
       JOIN Admin_Users a ON e.admin_id = a.admin_id
       WHERE e.election_id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Election not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllElections, getElectionById };
