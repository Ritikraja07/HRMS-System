const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, uploadAvatar, deleteUser } = require('../controllers/userController');
const { verifyToken } = require('../middleware/verifyToken');
const { isAdmin, isManagerOrAdmin } = require('../middleware/checkRole');

router.get('/', verifyToken, isManagerOrAdmin, getUsers);
router.get('/:id', verifyToken, getUser);
router.put('/:id', verifyToken, updateUser);
router.patch('/:id/avatar', verifyToken, uploadAvatar);
router.delete('/:id', verifyToken, isAdmin, deleteUser);

module.exports = router;
