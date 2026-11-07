const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const identifyUser = require('../middlewares/identifyUser');

// Khởi tạo URL giao dịch VNPay
router.post('/vnpay/create-payment-url', identifyUser, paymentController.createVNPayUrl);

// Xác thực giao dịch khi khách được redirect về từ VNPay
router.get('/vnpay/verify-return', paymentController.verifyVNPayReturn);

// IPN Webhook Server-to-Server từ VNPay
router.get('/vnpay/vnpay-ipn', paymentController.vnpayIpn);

module.exports = router;
