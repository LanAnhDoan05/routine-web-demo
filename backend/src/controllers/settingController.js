const settingService = require('../services/settingService');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/v1/settings/hero-banners (Public)
 */
async function getHeroBanners(req, res, next) {
  try {
    const banners = await settingService.getHeroBanners();
    return sendSuccess(res, banners, 'Lấy cấu hình Hero Banners thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/settings/hero-banners (Admin)
 */
async function updateHeroBanners(req, res, next) {
  try {
    const updated = await settingService.updateHeroBanners(req.body);
    return sendSuccess(res, updated, 'Cập nhật Hero Banners thành công');
  } catch (error) {
    next(error);
  }
}

async function getProductCardConfig(req, res, next) {
  try {
    const config = await settingService.getProductCardConfig();
    return sendSuccess(res, config, 'Lấy cấu hình Product Card thành công');
  } catch (error) {
    next(error);
  }
}

async function updateProductCardConfig(req, res, next) {
  try {
    const config = await settingService.updateProductCardConfig(req.body);
    return sendSuccess(res, config, 'Cập nhật cấu hình Product Card thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHeroBanners,
  updateHeroBanners,
  getProductCardConfig,
  updateProductCardConfig,
};
