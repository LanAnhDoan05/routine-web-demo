const express = require('express');
const router = express.Router();
const outfitController = require('../controllers/outfitController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// ==================== STOREFRONT (PUBLIC) ====================

// GET /api/v1/outfits (Hỗ trợ lọc occasion, style, pagination)
router.get('/', outfitController.getOutfits);

// GET /api/v1/outfits/featured (Danh sách outfit nổi bật)
router.get('/featured', outfitController.getFeaturedOutfits);

// GET /api/v1/outfits/:id (Chi tiết 1 outfit kèm thông tin sản phẩm)
router.get('/:id', outfitController.getOutfitById);

// GET /api/v1/outfits/:id/related (Outfit tương tự)
router.get('/:id/related', outfitController.getRelatedOutfits);

// ==================== ADMIN (PROTECTED) ====================

// POST /api/v1/outfits (Thêm outfit mới)
router.post('/', authenticate, authorizeAdmin, outfitController.createOutfit);

// PUT /api/v1/outfits/:id (Cập nhật outfit)
router.put('/:id', authenticate, authorizeAdmin, outfitController.updateOutfit);

// DELETE /api/v1/outfits/:id (Xóa outfit)
router.delete('/:id', authenticate, authorizeAdmin, outfitController.deleteOutfit);

module.exports = router;
