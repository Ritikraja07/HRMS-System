const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { verifyToken } = require('../middleware/verifyToken');

router.get('/', verifyToken, getTasks);
router.get('/:id', verifyToken, getTask);
router.post('/', verifyToken, createTask);
router.put('/:id', verifyToken, updateTask);
router.delete('/:id', verifyToken, deleteTask);

module.exports = router;
