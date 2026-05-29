const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember } = require('../controllers/projectController');
const { verifyToken } = require('../middleware/verifyToken');
const { isManagerOrAdmin, isAdmin } = require('../middleware/checkRole');

router.get('/', verifyToken, getProjects);
router.get('/:id', verifyToken, getProject);
router.post('/', verifyToken, isManagerOrAdmin, createProject);
router.put('/:id', verifyToken, isManagerOrAdmin, updateProject);
router.delete('/:id', verifyToken, isAdmin, deleteProject);
router.post('/:id/members', verifyToken, isManagerOrAdmin, addMember);
router.delete('/:id/members/:userId', verifyToken, isManagerOrAdmin, removeMember);

module.exports = router;
