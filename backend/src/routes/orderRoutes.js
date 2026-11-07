const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const identifyUser = require('../middlewares/identifyUser');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// ==================== ADMIN (PROTECTED) ====================
// Đặt trước route param /:id để tránh xung đột

// GET /api/v1/orders/admin/all (Xem toàn bộ đơn hàng hệ thống)
router.get('/admin/all', authenticate, authorizeAdmin, orderController.getAllOrdersForAdmin);

// PATCH /api/v1/orders/:id/status (Admin cập nhật trạng thái đơn hàng)
router.patch('/:id/status', authenticate, authorizeAdmin, orderController.updateOrderStatus);

// ==================== STOREFRONT / CUSTOMER ====================
// Sử dụng identifyUser để định danh user hoặc guest session
router.use(identifyUser);

// POST /api/v1/orders (Tạo đơn hàng mới)
router.post('/', orderController.createOrder);

// GET /api/v1/orders (Lấy danh sách đơn hàng của khách)
router.get('/', orderController.getOrders);

// GET /api/v1/orders/:id/hold-status (Xem trạng thái giữ tồn kho 5 phút)
router.get('/:id/hold-status', orderController.getHoldStatus);

// GET /api/v1/orders/:id (Xem chi tiết đơn hàng)
router.get('/:id', orderController.getOrderById);

// PATCH /api/v1/orders/:id/cancel (Hủy đơn hàng)
router.patch('/:id/cancel', orderController.cancelOrder);

// POST /api/v1/orders/:id/reorder (Mua lại đơn hàng)
router.post('/:id/reorder', orderController.reorder);

// POST /api/v1/orders/:id/send-invoice (Gửi hoặc gửi lại hóa đơn đơn hàng qua Email)
router.post('/:id/send-invoice', orderController.sendOrderInvoice);

module.exports = router;


