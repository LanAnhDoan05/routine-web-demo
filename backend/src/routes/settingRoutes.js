const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// GET /api/v1/settings/hero-banners (Public)
router.get('/hero-banners', settingController.getHeroBanners);
router.get('/product-card', settingController.getProductCardConfig);

// PUT /api/v1/settings/hero-banners (Admin)
router.put('/hero-banners', authenticate, authorizeAdmin, settingController.updateHeroBanners);
router.put('/product-card', authenticate, authorizeAdmin, settingController.updateProductCardConfig);

module.exports = router;
