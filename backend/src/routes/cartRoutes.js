const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const identifyUser = require('../middlewares/identifyUser');

// Tất cả các route cart đều đi qua identifyUser để xác định userId hoặc guest sessionId
router.use(identifyUser);

// Lấy thông tin giỏ hàng
router.get('/', cartController.getCart);

// Xóa sạch giỏ hàng
router.delete('/', cartController.clearCart);

// Thêm 1 sản phẩm
router.post('/items', cartController.addItem);

// Thêm combo nhiều món (Mua cả bộ Outfit)
router.post('/items/bulk', cartController.addBulkItems);

// Cập nhật số lượng của dòng sản phẩm
router.patch('/items/:lineId', cartController.updateQuantity);

// Xóa 1 dòng sản phẩm
router.delete('/items/:lineId', cartController.removeItem);

// Áp dụng mã voucher
router.post('/apply-coupon', cartController.applyCoupon);

// Hủy mã voucher
router.delete('/coupon', cartController.removeCoupon);

// Gộp giỏ hàng khách vào user sau khi đăng nhập
router.post('/merge', cartController.mergeCart);

module.exports = router;
