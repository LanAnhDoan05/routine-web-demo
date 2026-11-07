const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// POST /api/v1/upload/image (Yêu cầu đăng nhập xác thực tài khoản)
router.post(
  '/image',
  authenticate,
  authorizeAdmin,
  uploadController.uploadSingle,
  uploadController.handleUploadSuccess
);

module.exports = router;
