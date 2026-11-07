const cartService = require('../services/cartService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy thông tin giỏ hàng hiện tại
 */
async function getCart(req, res, next) {
  try {
    const cart = await cartService.getCart(req.identityId);
    return sendSuccess(res, cart, 'Lấy thông tin giỏ hàng thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm sản phẩm vào giỏ hàng
 */
async function addItem(req, res, next) {
  try {
    const { productId, size, color, quantity, image, name, price, category } = req.body;

    if (!productId) {
      return sendError(res, 'Vui lòng cung cấp productId', 400);
    }

    const updatedCart = await cartService.addItem(req.identityId, {
      productId,
      size,
      color,
      quantity,
      image,
      name,
      price,
      category,
    });

    return sendSuccess(res, updatedCart, 'Đã thêm sản phẩm vào giỏ hàng', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm combo nhiều sản phẩm (Mua cả bộ Outfit)
 */
async function addBulkItems(req, res, next) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Vui lòng cung cấp danh sách sản phẩm (mảng items)', 400);
    }

    const updatedCart = await cartService.addBulkItems(req.identityId, items);
    return sendSuccess(res, updatedCart, 'Đã thêm combo sản phẩm vào giỏ hàng', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật số lượng của một dòng sản phẩm
 */
async function updateQuantity(req, res, next) {
  try {
    const { lineId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      return sendError(res, 'Vui lòng cung cấp số lượng mới', 400);
    }

    const updatedCart = await cartService.updateItemQuantity(req.identityId, lineId, quantity);
    return sendSuccess(res, updatedCart, 'Cập nhật số lượng thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa một dòng sản phẩm khỏi giỏ hàng
 */
async function removeItem(req, res, next) {
  try {
    const { lineId } = req.params;
    const updatedCart = await cartService.removeItem(req.identityId, lineId);
    return sendSuccess(res, updatedCart, 'Đã xóa sản phẩm khỏi giỏ hàng');
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa toàn bộ giỏ hàng
 */
async function clearCart(req, res, next) {
  try {
    const emptyCart = await cartService.clearCart(req.identityId);
    return sendSuccess(res, emptyCart, 'Đã dọn sạch giỏ hàng');
  } catch (error) {
    next(error);
  }
}

/**
 * Áp dụng mã giảm giá voucher
 */
async function applyCoupon(req, res, next) {
  try {
    const { code } = req.body;

    if (!code) {
      return sendError(res, 'Vui lòng nhập mã giảm giá', 400);
    }

    const updatedCart = await cartService.applyCoupon(req.identityId, code);
    return sendSuccess(res, updatedCart, 'Áp dụng mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Hủy mã giảm giá
 */
async function removeCoupon(req, res, next) {
  try {
    const updatedCart = await cartService.removeCoupon(req.identityId);
    return sendSuccess(res, updatedCart, 'Đã hủy mã giảm giá');
  } catch (error) {
    next(error);
  }
}

/**
 * Gộp giỏ hàng từ khách sang tài khoản đã đăng nhập
 */
async function mergeCart(req, res, next) {
  try {
    const { guestSessionId } = req.body;

    if (!guestSessionId) {
      return sendError(res, 'Vui lòng cung cấp guestSessionId để gộp', 400);
    }

    const mergedCart = await cartService.mergeCart(guestSessionId, req.identityId);
    return sendSuccess(res, mergedCart, 'Gộp giỏ hàng thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCart,
  addItem,
  addBulkItems,
  updateQuantity,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeCart,
};
