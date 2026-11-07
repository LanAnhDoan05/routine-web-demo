const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// GET /api/v1/search/suggestions?q=... (Gợi ý autocomplete)
router.get('/suggestions', searchController.getSuggestions);

// POST & GET /api/v1/search/vector (Tìm kiếm vector ChromaDB)
router.get('/vector', searchController.searchVector);
router.post('/vector', searchController.searchVector);

// POST /api/v1/search/rag (Đóng khung AI Stylist RAG)
router.post('/rag', searchController.askRAG);

// GET /api/v1/search/points (Lấy toàn bộ điểm vector 2D)
router.get('/points', searchController.getVectorPoints);

module.exports = router;
