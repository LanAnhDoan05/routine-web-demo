const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const identifyUser = require('../middlewares/identifyUser');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

// Public tracking endpoint (nhận cả guestSessionId và token nếu có)
router.post('/track', identifyUser, analyticsController.track);

// Admin-only endpoints
router.get('/admin/dashboard', authenticate, authorizeAdmin, analyticsController.getDashboard);
router.get('/admin/overview', authenticate, authorizeAdmin, analyticsController.getOverview);
router.get('/admin/guests', authenticate, authorizeAdmin, analyticsController.getGuests);

module.exports = router;
