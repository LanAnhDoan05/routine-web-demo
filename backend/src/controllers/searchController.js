const searchService = require('../services/searchService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy gợi ý tìm kiếm (Autocomplete)
 */
async function getSuggestions(req, res, next) {
  try {
    const { q } = req.query;
    const result = await searchService.getSuggestions(q);
    return sendSuccess(res, result, 'Lấy gợi ý tìm kiếm thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy danh sách từ khóa tìm kiếm hot
 */
async function getTrendingKeywords(req, res, next) {
  try {
    const result = await searchService.getTrendingKeywords();
    return sendSuccess(res, result, 'Lấy danh sách từ khóa thịnh hành thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Tìm kiếm sản phẩm theo tọa độ vector ChromaDB
 */
async function searchVector(req, res, next) {
  try {
    const { q, query, limit } = req.body || req.query;
    const searchQuery = q || query;
    const chromaSearchService = require('../services/chromaSearchService');
    const result = await chromaSearchService.searchByVector(searchQuery, Number(limit) || 5);
    return sendSuccess(res, result, 'Tìm kiếm vector thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Đóng khung AI Stylist từ ChromaDB
 */
async function askRAG(req, res, next) {
  try {
    const { keyword, limit } = req.body;
    const chromaSearchService = require('../services/chromaSearchService');
    const result = await chromaSearchService.askRAGStylist(keyword, Number(limit) || 4);
    return sendSuccess(res, result, 'Truy vấn AI RAG thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy toàn bộ tọa độ Vector 2D để vẽ biểu đồ trực quan hóa
 */
async function getVectorPoints(req, res, next) {
  try {
    const chromaSearchService = require('../services/chromaSearchService');
    const points = await chromaSearchService.getAll2DPoints();
    return sendSuccess(res, points, 'Lấy danh sách điểm tọa độ Vector 2D thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSuggestions,
  getTrendingKeywords,
  searchVector,
  askRAG,
  getVectorPoints,
};
