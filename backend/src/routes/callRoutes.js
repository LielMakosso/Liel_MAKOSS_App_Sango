const express = require('express');
const router = express.Router();
const CallController = require('../controllers/callController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', CallController.getAll);
router.get('/:conversationId', CallController.getHistory);

module.exports = router;
