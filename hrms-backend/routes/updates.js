const express = require('express');
const router = express.Router();
const { getUpdates, createUpdate, updateUpdate } = require('../controllers/updateController');
const { verifyToken } = require('../middleware/verifyToken');
router.get('/', verifyToken, getUpdates);
router.post('/', verifyToken, createUpdate);
router.put('/:id', verifyToken, updateUpdate);
module.exports = router;
