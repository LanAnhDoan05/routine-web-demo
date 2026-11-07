const reviewService = require('../services/reviewService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy danh sách đánh giá của sản phẩm
 */
async function getProductReviews(req, res, next) {
  try {
    const { productId } = req.params;
    const { rating, page, limit } = req.query;

    const result = await reviewService.getProductReviews(productId, {
      rating,
      page,
      limit,
    });

    return sendSuccess(res, result, 'Lấy danh sách đánh giá thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Gửi đánh giá cho sản phẩm
 */
async function createReview(req, res, next) {
  try {
    const { productId } = req.params;
    const result = await reviewService.createReview(req.user, productId, req.body);
    return sendSuccess(res, result, 'Đánh giá sản phẩm thành công', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa đánh giá (Admin)
 */
async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await reviewService.deleteReview(id, req.user);
    return sendSuccess(res, deleted, 'Xóa đánh giá thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy toàn bộ đánh giá hệ thống (Admin)
 */
async function getAllReviewsForAdmin(req, res, next) {
  try {
    const { page, limit, rating, status, productId, search } = req.query;
    const result = await reviewService.getAllReviewsForAdmin({
      page,
      limit,
      rating,
      status,
      productId,
      search,
    });
    return sendSuccess(res, result, 'Lấy toàn bộ đánh giá hệ thống thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật trạng thái đánh giá (Admin)
 */
async function updateReviewStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await reviewService.updateReviewStatus(id, status);
    return sendSuccess(res, result, 'Cập nhật trạng thái đánh giá thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Thống kê đánh giá hệ thống (Admin)
 */
async function getReviewStatsForAdmin(req, res, next) {
  try {
    const stats = await reviewService.getReviewStatsForAdmin();
    return sendSuccess(res, stats, 'Lấy thống kê đánh giá thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProductReviews,
  createReview,
  deleteReview,
  getAllReviewsForAdmin,
  updateReviewStatus,
  getReviewStatsForAdmin,
};

