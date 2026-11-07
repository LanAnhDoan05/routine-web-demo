const express = require('express');
const router = express.Router();

const aiController = require('../controllers/aiController');
const identifyUser = require('../middlewares/identifyUser');
const { authenticate } = require('../middlewares/auth');

// POST /api/v1/ai/chat (Trò chuyện đa lượt với AI Stylist, tự động chuẩn hóa từ ngữ tiếng Việt & ghép đồ)
router.post('/chat', identifyUser, aiController.chat);

// POST /api/v1/ai/stylist (Tư vấn phối đồ thông minh, hỗ trợ cả khách vãng lai và thành viên)
router.post('/stylist', identifyUser, aiController.getOutfitRecommendation);

// POST /api/v1/ai/suggest (Yêu cầu đăng nhập, tương thích ngược với API cũ)
router.post('/suggest', authenticate, aiController.getRoutineSuggestions);

module.exports = router;
