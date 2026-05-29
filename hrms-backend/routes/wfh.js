const express = require('express');
const router = express.Router();
const { getWfhRequests, createWfhRequest, updateWfhStatus, cancelWfhRequest } = require('../controllers/wfhController');
const { verifyToken } = require('../middleware/verifyToken');
const { isManagerOrAdmin } = require('../middleware/checkRole');

router.get('/', verifyToken, getWfhRequests);
router.post('/', verifyToken, createWfhRequest);
router.patch('/:id/status', verifyToken, isManagerOrAdmin, updateWfhStatus);
router.patch('/:id/cancel', verifyToken, cancelWfhRequest);

module.exports = router;
