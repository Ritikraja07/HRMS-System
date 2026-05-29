const express = require('express');
const router = express.Router();
const { getPayslips, getPayslip, createPayslip, updatePayslip, bulkPublishPayslips } = require('../controllers/payslipController');
const { verifyToken } = require('../middleware/verifyToken');
const { isManagerOrAdmin } = require('../middleware/checkRole');

router.get('/', verifyToken, getPayslips);
router.get('/:id', verifyToken, getPayslip);
router.post('/bulk-publish', verifyToken, isManagerOrAdmin, bulkPublishPayslips);
router.post('/', verifyToken, isManagerOrAdmin, createPayslip);
router.put('/:id', verifyToken, isManagerOrAdmin, updatePayslip);

module.exports = router;
