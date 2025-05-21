// routes/jobs.js
const express = require('express');
const router = express.Router();
const { getAllJobs, createJob } = require('../controllers/jobController');

router.get('/', getAllJobs);
router.post('/', createJob);

module.exports = router;