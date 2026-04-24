const express = require('express');
const router = express.Router();
const { getCandidatesByElection, getCandidateById } = require('../controllers/candidateController');

router.get('/', getCandidatesByElection);
router.get('/:id', getCandidateById);

module.exports = router;
