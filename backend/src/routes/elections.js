const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/elections/active — currently active election(s)
router.get("/active", async (req, res) => {
    const [rows] = await pool.query(
        "SELECT election_id, title, description, start_time, end_time, on_chain_proposal_id FROM Elections WHERE is_active = TRUE"
    );
    res.json(rows);
})

// GET /api/elections/:id/candidates — candidate list + option_index mapping
router.get("/:id/candidates", async (req, res) => {
    const [rows] = await pool.query(
        "SELECT candidate_id, candidate_name, party_or_affiliation, bio, option_index, profile_image_url FROM Candidates WHERE election_id = ? ORDER BY option_index ASC",
        [req.params.id]
    );
    res.json(rows);
});

module.exports = router;
