// routes/users.js
const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById } = require('../controllers/userController');

router.get('/', getAllUsers);
router.get('/:uuid', getUserById);

module.exports = router;