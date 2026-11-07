const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

// POST /api/v1/newsletter/subscribe
router.post('/subscribe', newsletterController.subscribe);

module.exports = router;
