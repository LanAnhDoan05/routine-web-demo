const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// GET /api/v1/reviews/product/:productId
router.get('/product/:productId', reviewController.getProductReviews);

// POST /api/v1/reviews/product/:productId (Người dùng gửi đánh giá)
router.post('/product/:productId', authenticate, reviewController.createReview);

// ==================== ADMIN (PROTECTED) ====================
// Đặt trước route param /:id để tránh xung đột

// GET /api/v1/reviews/admin/all (Xem toàn bộ đánh giá hệ thống)
router.get('/admin/all', authenticate, authorizeAdmin, reviewController.getAllReviewsForAdmin);

// GET /api/v1/reviews/admin/stats (Thống kê đánh giá hệ thống)
router.get('/admin/stats', authenticate, authorizeAdmin, reviewController.getReviewStatsForAdmin);

// PATCH /api/v1/reviews/:id/status (Admin duyệt / ẩn đánh giá)
router.patch('/:id/status', authenticate, authorizeAdmin, reviewController.updateReviewStatus);

// DELETE /api/v1/reviews/:id (Người dùng xóa đánh giá của mình hoặc Admin xóa)
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router;
