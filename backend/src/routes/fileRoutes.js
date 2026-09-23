const express = require('express');
const multer = require('multer');
const router = express.Router();
const FileController = require('../controllers/fileController');
const authMiddleware = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authMiddleware);

router.post('/upload', upload.single('file'), FileController.upload);
router.get('/:id', FileController.getOne);

module.exports = router;
