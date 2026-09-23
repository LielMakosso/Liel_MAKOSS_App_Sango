const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/conversationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/private', ConversationController.createPrivate);
router.post('/group', ConversationController.createGroup);
router.get('/', ConversationController.listMine);
router.get('/:id', ConversationController.getOne);
router.put('/:id/read', ConversationController.markAsRead);
module.exports = router;
