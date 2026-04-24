const db = require('../db/connection');

const getCandidatesByElection = async (req, res, next) => {
  try {
    const electionId = req.query.election_id;
    
    if (!electionId) {
      return res.status(400).json({ error: 'election_id query parameter required' });
    }
    
    const [rows] = await db.query(
      `SELECT * FROM Candidates
       WHERE election_id = ?
       ORDER BY option_index ASC`,
      [electionId]
    );
    
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getCandidateById = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM Candidates WHERE candidate_id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCandidatesByElection, getCandidateById };
