const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { authenticate } = require('../middlewares/auth');

// Tất cả các route /users đều yêu cầu đăng nhập
router.use(authenticate);

// Sổ địa chỉ người dùng
router.get('/addresses', addressController.getAddresses);
router.post('/addresses', addressController.createAddress);
router.put('/addresses/:id', addressController.updateAddress);
router.delete('/addresses/:id', addressController.deleteAddress);
router.patch('/addresses/:id/default', addressController.setDefaultAddress);

module.exports = router;
