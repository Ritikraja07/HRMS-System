const express = require('express');
const router = express.Router();
const { login, logout, refreshSession, getMe, updateFcmToken } = require('../controllers/authController');
const { verifyToken } = require('../middleware/verifyToken');
const { strictRateLimiter } = require('../middleware/rateLimiter');

router.post('/login', strictRateLimiter, login);
router.post('/logout', verifyToken, logout);
router.post('/refresh', refreshSession);
router.get('/me', verifyToken, getMe);
router.patch('/fcm-token', verifyToken, updateFcmToken);

module.exports = router;
