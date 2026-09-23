const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', MessageController.send);
router.get('/:conversationId', MessageController.getHistory);

module.exports = router;
