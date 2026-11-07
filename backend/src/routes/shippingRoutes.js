const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

router.post('/check-address', shippingController.checkAddress);
router.post('/calculate', shippingController.calculateShipping);

module.exports = router;
