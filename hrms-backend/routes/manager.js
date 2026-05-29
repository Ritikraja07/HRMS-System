const express = require('express');
const router = express.Router();
const { getDashboard, getPendingApprovals, getTeam } = require('../controllers/managerController');
const { verifyToken } = require('../middleware/verifyToken');
const { isManagerOrAdmin } = require('../middleware/checkRole');
router.get('/dashboard', verifyToken, isManagerOrAdmin, getDashboard);
router.get('/approvals', verifyToken, isManagerOrAdmin, getPendingApprovals);
router.get('/team', verifyToken, isManagerOrAdmin, getTeam);
module.exports = router;
