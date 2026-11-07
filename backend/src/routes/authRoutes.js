const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

// POST /api/v1/auth/register (Đăng ký tài khoản)
router.post('/register', validateRegister, authController.register);

// POST /api/v1/auth/login (Đăng nhập)
router.post('/login', validateLogin, authController.login);

// GET /api/v1/auth/me (Lấy thông tin tài khoản hiện tại)
router.get('/me', authenticate, authController.getMe);

// POST /api/v1/auth/check-existence (Kiểm tra email hoặc số điện thoại đã tồn tại chưa)
router.post('/check-existence', authController.checkExistence);

// POST /api/v1/auth/send-otp (Gửi mã OTP)
router.post('/send-otp', authController.sendOtp);

// POST /api/v1/auth/verify-otp (Xác thực mã OTP)
router.post('/verify-otp', authController.verifyOtp);

// POST /api/v1/auth/forgot-password (Yêu cầu OTP quên mật khẩu)
router.post('/forgot-password', authController.sendOtp);

// POST /api/v1/auth/reset-password (Đặt lại mật khẩu mới)
router.post('/reset-password', authController.resetPassword);

// PATCH /api/v1/auth/style-preference (Lưu phong cách thời trang cá nhân)
router.patch('/style-preference', authenticate, authController.updateStylePreference);

// PUT /api/v1/auth/profile (Cập nhật thông tin tài khoản)
router.put('/profile', authenticate, authController.updateProfile);

// PUT /api/v1/auth/change-password (Đổi mật khẩu tài khoản)
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
