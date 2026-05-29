const express = require('express');
const router = express.Router();
const { getNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/verifyToken');
router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markRead);
router.patch('/read-all', verifyToken, markAllRead);
router.delete('/:id', verifyToken, deleteNotification);
module.exports = router;
