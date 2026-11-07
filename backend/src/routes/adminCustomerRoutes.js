const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// Tất cả route quản lý khách hàng đều yêu cầu quyền ADMIN
router.use(authenticate, authorizeAdmin);

// GET /api/v1/admin/customers (Danh sách khách hàng)
router.get('/', customerController.getCustomers);

// GET /api/v1/admin/customers/:id (Chi tiết khách hàng và lịch sử đơn hàng)
router.get('/:id', customerController.getCustomerById);

// PATCH /api/v1/admin/customers/:id/status (Khóa / Mở khóa tài khoản khách hàng)
router.patch('/:id/status', customerController.updateCustomerStatus);

module.exports = router;
