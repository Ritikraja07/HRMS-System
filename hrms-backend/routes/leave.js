const express = require('express');
const router = express.Router();
const { getLeaveRequests, getLeaveBalance, createLeaveRequest, updateLeaveStatus, cancelLeaveRequest } = require('../controllers/leaveController');
const { verifyToken } = require('../middleware/verifyToken');
const { isManagerOrAdmin } = require('../middleware/checkRole');

router.get('/balance', verifyToken, getLeaveBalance);
router.get('/', verifyToken, getLeaveRequests);
router.post('/', verifyToken, createLeaveRequest);
router.patch('/:id/status', verifyToken, isManagerOrAdmin, updateLeaveStatus);
router.patch('/:id/cancel', verifyToken, cancelLeaveRequest);

module.exports = router;
