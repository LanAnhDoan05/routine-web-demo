const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// ==================== STOREFRONT (PUBLIC) ====================

// GET /api/v1/categories (Hỗ trợ ?type=quick | mega)
router.get('/', categoryController.getCategories);

// GET /api/v1/categories/styles (Danh sách toàn bộ styles)
router.get('/styles', categoryController.getStyles);

// GET /api/v1/categories/styles/:slug (Chi tiết 1 style)
router.get('/styles/:slug', categoryController.getStyleBySlug);

// GET /api/v1/categories/:slug (Chi tiết category theo slug)
router.get('/:slug', categoryController.getCategoryBySlug);

// ==================== ADMIN (PROTECTED) ====================

// POST /api/v1/categories (Thêm danh mục mới)
router.post('/', authenticate, authorizeAdmin, categoryController.createCategory);

// PUT /api/v1/categories/:slug (Cập nhật danh mục)
router.put('/:slug', authenticate, authorizeAdmin, categoryController.updateCategory);

// DELETE /api/v1/categories/:slug (Xóa danh mục)
router.delete('/:slug', authenticate, authorizeAdmin, categoryController.deleteCategory);

module.exports = router;
