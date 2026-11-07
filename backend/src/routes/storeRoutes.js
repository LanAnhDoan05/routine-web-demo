const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// ==================== PUBLIC ====================

// GET /api/v1/stores (Lấy danh sách cửa hàng kèm bộ lọc)
router.get('/', storeController.getStores);

// GET /api/v1/stores/stats (Thống kê tổng quan hệ thống cửa hàng)
router.get('/stats', storeController.getStoreStats);

// GET /api/v1/stores/:id (Chi tiết cửa hàng)
router.get('/:id', storeController.getStoreById);

// ==================== ADMIN (PROTECTED) ====================

// POST /api/v1/stores (Tạo mới cửa hàng)
router.post('/', authenticate, authorizeAdmin, storeController.createStore);

// POST /api/v1/stores/reset-defaults (Khôi phục 25 cửa hàng mẫu mặc định)
router.post('/reset-defaults', authenticate, authorizeAdmin, storeController.resetDefaultStores);

// PUT /api/v1/stores/:id (Cập nhật thông tin cửa hàng)
router.put('/:id', authenticate, authorizeAdmin, storeController.updateStore);

// PATCH /api/v1/stores/:id/toggle-status (Bật/tắt trạng thái hoạt động)
router.patch('/:id/toggle-status', authenticate, authorizeAdmin, storeController.toggleStoreStatus);

// DELETE /api/v1/stores/:id (Xóa cửa hàng)
router.delete('/:id', authenticate, authorizeAdmin, storeController.deleteStore);

module.exports = router;
