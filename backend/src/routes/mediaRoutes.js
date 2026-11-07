const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// GET /api/v1/media/:id (Phục vụ ảnh công khai từ Database)
router.get('/:id', mediaController.serveMedia);

// DELETE /api/v1/media/:id (Chỉ Admin)
router.delete('/:id', authenticate, authorizeAdmin, mediaController.deleteMedia);

module.exports = router;
