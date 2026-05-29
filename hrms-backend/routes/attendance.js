const express = require('express');
const router = express.Router();
const { punchIn, punchOut, startBreak, endBreak, getAttendance, getMyAttendance, getTodayStatus } = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/verifyToken');
const { isManagerOrAdmin } = require('../middleware/checkRole');

router.post('/punch-in', verifyToken, punchIn);
router.post('/punch-out', verifyToken, punchOut);
router.post('/break/start', verifyToken, startBreak);
router.post('/break/end', verifyToken, endBreak);
router.get('/today', verifyToken, getTodayStatus);
router.get('/my', verifyToken, getMyAttendance);
router.get('/', verifyToken, isManagerOrAdmin, getAttendance);

module.exports = router;
