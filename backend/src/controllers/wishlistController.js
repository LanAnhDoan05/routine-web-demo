const wishlistService = require('../services/wishlistService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy danh sách sản phẩm yêu thích (kèm đầy đủ dữ liệu sản phẩm)
 */
async function getWishlist(req, res, next) {
  try {
    const data = await wishlistService.getWishlist(req.identityId);
    return sendSuccess(res, data, 'Lấy danh sách yêu thích thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm sản phẩm vào danh sách yêu thích
 */
async function addItem(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) {
      return sendError(res, 'Vui lòng cung cấp productId', 400);
    }

    const data = await wishlistService.addItem(req.identityId, productId);
    return sendSuccess(res, data, 'Đã thêm sản phẩm vào danh sách yêu thích', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa sản phẩm khỏi danh sách yêu thích
 */
async function removeItem(req, res, next) {
  try {
    const { productId } = req.params;
    const data = await wishlistService.removeItem(req.identityId, productId);
    return sendSuccess(res, data, 'Đã xóa sản phẩm khỏi danh sách yêu thích');
  } catch (error) {
    next(error);
  }
}

/**
 * Bật/tắt trạng thái yêu thích của sản phẩm (Toggle)
 */
async function toggleItem(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) {
      return sendError(res, 'Vui lòng cung cấp productId', 400);
    }

    const result = await wishlistService.toggleItem(req.identityId, productId);
    const message = result.inWishlist
      ? 'Đã thêm sản phẩm vào danh sách yêu thích'
      : 'Đã xóa sản phẩm khỏi danh sách yêu thích';

    return sendSuccess(res, result, message);
  } catch (error) {
    next(error);
  }
}

/**
 * Kiểm tra xem sản phẩm có nằm trong danh sách yêu thích không
 */
async function checkInWishlist(req, res, next) {
  try {
    const { productId } = req.params;
    const result = await wishlistService.checkInWishlist(req.identityId, productId);
    return sendSuccess(res, result, 'Kiểm tra trạng thái yêu thích thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa sạch danh sách yêu thích
 */
async function clearWishlist(req, res, next) {
  try {
    const data = await wishlistService.clearWishlist(req.identityId);
    return sendSuccess(res, data, 'Đã xóa toàn bộ danh sách yêu thích');
  } catch (error) {
    next(error);
  }
}

/**
 * Gộp wishlist từ khách sang tài khoản khi đăng nhập
 */
async function mergeWishlist(req, res, next) {
  try {
    const { guestSessionId } = req.body;
    if (!guestSessionId) {
      return sendError(res, 'Vui lòng cung cấp guestSessionId để gộp', 400);
    }

    const data = await wishlistService.mergeWishlist(guestSessionId, req.identityId);
    return sendSuccess(res, data, 'Gộp danh sách yêu thích thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWishlist,
  addItem,
  removeItem,
  toggleItem,
  checkInWishlist,
  clearWishlist,
  mergeWishlist,
};
