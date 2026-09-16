const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { requireAdmin } = require("../authMiddleware");

// POST /api/admin/login — admin login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM Admin_Users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ admin_id: admin.admin_id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ token });
});

// POST /api/admin/elections — create election
router.post("/elections", requireAdmin, async (req, res) => {
  const { title, description, start_time, end_time, on_chain_proposal_id } = req.body;
  const [result] = await pool.query(
    "INSERT INTO Elections (admin_id, title, description, start_time, end_time, on_chain_proposal_id, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)",
    [req.admin.admin_id, title, description, start_time, end_time, on_chain_proposal_id]
  );
  res.status(201).json({ election_id: result.insertId });
});

// POST /api/admin/elections/:id/candidates — add a candidate
router.post("/elections/:id/candidates", requireAdmin, async (req, res) => {
  const { candidate_name, party_or_affiliation, bio, option_index, profile_image_url } = req.body;
  const [result] = await pool.query(
    "INSERT INTO Candidates (election_id, candidate_name, party_or_affiliation, bio, option_index, profile_image_url) VALUES (?, ?, ?, ?, ?, ?)",
    [req.params.id, candidate_name, party_or_affiliation, bio, option_index, profile_image_url]
  );
  res.status(201).json({ candidate_id: result.insertId });
});

module.exports = router;
