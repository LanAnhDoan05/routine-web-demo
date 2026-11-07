const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// ==================== ADMIN (PROTECTED) ====================
// Đặt trước route param /:code để tránh xung đột
router.get('/admin/all', authenticate, authorizeAdmin, couponController.getAllCouponsForAdmin);

// POST /api/v1/coupons (Admin tạo mã mới)
router.post('/', authenticate, authorizeAdmin, couponController.createCoupon);

// PUT /api/v1/coupons/:code (Admin cập nhật mã)
router.put('/:code', authenticate, authorizeAdmin, couponController.updateCoupon);

// DELETE /api/v1/coupons/:code (Admin xóa mã)
router.delete('/:code', authenticate, authorizeAdmin, couponController.deleteCoupon);

// ==================== STOREFRONT (PUBLIC) ====================

// GET /api/v1/coupons (Lấy danh sách mã giảm giá khả dụng)
router.get('/', couponController.getActiveCoupons);

// POST /api/v1/coupons/validate (Kiểm tra điều kiện áp dụng mã)
router.post('/validate', couponController.validateCoupon);

module.exports = router;
