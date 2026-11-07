const outfitService = require('../services/outfitService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy danh sách outfit có phân trang và bộ lọc
 */
async function getOutfits(req, res, next) {
  try {
    const { occasion, style, page, limit } = req.query;
    const result = await outfitService.getOutfits({ occasion, style, page, limit });
    return sendSuccess(res, result, 'Lấy danh sách Outfit thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy danh sách outfit nổi bật
 */
async function getFeaturedOutfits(req, res, next) {
  try {
    const { limit } = req.query;
    const items = await outfitService.getFeaturedOutfits(limit);
    return sendSuccess(res, items, 'Lấy danh sách Outfit nổi bật thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy chi tiết outfit theo ID
 */
async function getOutfitById(req, res, next) {
  try {
    const { id } = req.params;
    const outfit = await outfitService.getOutfitById(id);

    if (!outfit) {
      return sendError(res, `Không tìm thấy Outfit với mã: "${id}"`, 404);
    }

    return sendSuccess(res, outfit, 'Lấy thông tin Outfit thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy các outfit liên quan
 */
async function getRelatedOutfits(req, res, next) {
  try {
    const { id } = req.params;
    const { limit } = req.query;
    const items = await outfitService.getRelatedOutfits(id, limit);
    return sendSuccess(res, items, 'Lấy danh sách Outfit liên quan thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm outfit mới (Admin)
 */
async function createOutfit(req, res, next) {
  try {
    const newOutfit = await outfitService.createOutfit(req.body);
    return sendSuccess(res, newOutfit, 'Thêm Outfit mới thành công', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật outfit (Admin)
 */
async function updateOutfit(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await outfitService.updateOutfit(id, req.body);
    return sendSuccess(res, updated, 'Cập nhật Outfit thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa outfit (Admin)
 */
async function deleteOutfit(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await outfitService.deleteOutfit(id);
    return sendSuccess(res, deleted, 'Xóa Outfit thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOutfits,
  getFeaturedOutfits,
  getOutfitById,
  getRelatedOutfits,
  createOutfit,
  updateOutfit,
  deleteOutfit,
};
