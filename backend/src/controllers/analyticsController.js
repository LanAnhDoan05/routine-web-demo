const analyticsService = require('../services/analyticsService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/v1/analytics/track (Public tracking endpoint)
 */
async function track(req, res) {
  try {
    const { platform, campaign, productId, guestSessionId, action, metadata } = req.body;
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const result = await analyticsService.trackEvent({
      platform,
      campaign,
      productId,
      guestSessionId,
      userId,
      action: action || 'VIEW',
      metadata,
      ipAddress,
    });

    return sendSuccess(res, result, 'Đã ghi nhận sự kiện tracking');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * GET /api/v1/analytics/admin/overview (Admin only)
 */
async function getOverview(req, res) {
  try {
    const stats = await analyticsService.getEcosystemStats();
    return sendSuccess(res, stats, 'Lấy báo cáo hệ sinh thái thành công');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * GET /api/v1/analytics/admin/dashboard (Admin only)
 */
async function getDashboard(req, res) {
  try {
    const data = await analyticsService.getDashboardStats();
    return sendSuccess(res, data, 'Lấy dữ liệu Dashboard quản trị thành công');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * GET /api/v1/analytics/admin/guests (Admin only)
 */
async function getGuests(req, res) {
  try {
    const { page, limit, platform, search } = req.query;
    const result = await analyticsService.getGuestVisitors({ page, limit, platform, search });
    return sendSuccess(res, result, 'Lấy danh sách khách vãng lai thành công');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  track,
  getOverview,
  getDashboard,
  getGuests,
};
