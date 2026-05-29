const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, deleteMessage, uploadFile } = require('../controllers/messageController');
const { verifyToken } = require('../middleware/verifyToken');

router.get('/:projectId', verifyToken, getMessages);
router.post('/:projectId', verifyToken, sendMessage);
router.delete('/:projectId/:messageId', verifyToken, deleteMessage);
router.post('/:projectId/upload', verifyToken, uploadFile);

module.exports = router;
