const express = require('express');
const router  = express.Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementsController');
const { verifyToken } = require('../middleware/verifyToken');
const { isAdmin }     = require('../middleware/checkRole');

router.get('/',     verifyToken,          getAnnouncements);
router.post('/',    verifyToken, isAdmin, createAnnouncement);
router.put('/:id',  verifyToken, isAdmin, updateAnnouncement);
router.delete('/:id', verifyToken, isAdmin, deleteAnnouncement);

module.exports = router;
