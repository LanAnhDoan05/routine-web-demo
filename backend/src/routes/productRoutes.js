const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// ==================== STOREFRONT (PUBLIC) ====================

// GET /api/v1/products (Hỗ trợ lọc category, gender, style, price, search, sort, pagination)
router.get('/', productController.getProducts);

// GET /api/v1/products/featured (Sản phẩm nổi bật / Best Seller)
router.get('/featured', productController.getFeaturedProducts);

// GET /api/v1/products/trending (Sản phẩm thịnh hành, hỗ trợ ?gender=men|women|unisex)
router.get('/trending', productController.getTrendingProducts);

// GET /api/v1/products/check-sku (Kiểm tra mã SKU khả dụng)
router.get('/check-sku', authenticate, authorizeAdmin, productController.checkSkuAvailability);

// Admin-only catalog endpoints include draft and inactive products.
router.get('/admin/all', authenticate, authorizeAdmin, productController.getAdminProducts);
router.get('/admin/:id', authenticate, authorizeAdmin, productController.getAdminProductById);

// GET /api/v1/products/:id (Chi tiết một sản phẩm)
router.get('/:id', productController.getProductById);

// GET /api/v1/products/:id/related (Sản phẩm liên quan)
router.get('/:id/related', productController.getRelatedProducts);

// GET /api/v1/products/:productId/reviews (Xem đánh giá sản phẩm)
router.get('/:productId/reviews', require('../controllers/reviewController').getProductReviews);

// POST /api/v1/products/:productId/reviews (Đăng đánh giá sản phẩm)
router.post('/:productId/reviews', authenticate, require('../controllers/reviewController').createReview);

// ==================== ADMIN (PROTECTED) ====================

// POST /api/v1/products/bulk-delete (Xóa nhiều sản phẩm cùng lúc)
router.post('/bulk-delete', authenticate, authorizeAdmin, productController.bulkDeleteProducts);

// POST /api/v1/products/:id/duplicate (Nhân bản sản phẩm)
router.post('/:id/duplicate', authenticate, authorizeAdmin, productController.duplicateProduct);

// POST /api/v1/products (Thêm sản phẩm mới)
router.post('/', authenticate, authorizeAdmin, productController.createProduct);

// PUT /api/v1/products/:id (Cập nhật thông tin sản phẩm)
router.put('/:id', authenticate, authorizeAdmin, productController.updateProduct);

// DELETE /api/v1/products/:id (Xóa sản phẩm)
router.delete('/:id', authenticate, authorizeAdmin, productController.deleteProduct);

module.exports = router;
