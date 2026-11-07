const express = require('express');
const router = express.Router();
const styleController = require('../controllers/styleController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// ==================== PUBLIC ====================

// GET /api/v1/styles (Danh sách phong cách)
router.get('/', styleController.getStyles);

// GET /api/v1/styles/counts (Thống kê số lượng sản phẩm)
router.get('/counts', styleController.getStyleProductCounts);

// GET /api/v1/styles/:idOrSlug (Chi tiết phong cách)
router.get('/:idOrSlug', styleController.getStyleByIdOrSlug);

// ==================== ADMIN (PROTECTED) ====================

// POST /api/v1/styles (Tạo mới phong cách)
router.post('/', authenticate, authorizeAdmin, styleController.createStyle);

// PUT /api/v1/styles/:idOrSlug (Cập nhật phong cách)
router.put('/:idOrSlug', authenticate, authorizeAdmin, styleController.updateStyle);

// DELETE /api/v1/styles/:idOrSlug (Xóa phong cách)
router.delete('/:idOrSlug', authenticate, authorizeAdmin, styleController.deleteStyle);

module.exports = router;
