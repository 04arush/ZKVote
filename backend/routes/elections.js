const express = require('express');
const router = express.Router();
const { getAllElections, getElectionById } = require('../controllers/electionController');

router.get('/', getAllElections);
router.get('/:id', getElectionById);

module.exports = router;
