const couponService = require('../services/couponService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy danh sách các mã giảm giá đang kích hoạt cho Storefront
 */
async function getActiveCoupons(req, res, next) {
  try {
    const list = await couponService.getActiveCoupons();
    return sendSuccess(res, list, 'Lấy danh sách mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy toàn bộ danh sách mã giảm giá cho Admin (kể cả mã tạm dừng)
 */
async function getAllCouponsForAdmin(req, res, next) {
  try {
    const { status, search } = req.query;
    const list = await couponService.getAllCouponsForAdmin({ status, search });
    return sendSuccess(res, list, 'Lấy danh sách toàn bộ mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Kiểm tra tính hợp lệ của mã giảm giá
 */
async function validateCoupon(req, res, next) {
  try {
    const { code, subtotal } = req.body;
    const result = await couponService.validateCoupon(code, subtotal);
    return sendSuccess(res, result, 'Mã giảm giá hợp lệ');
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm mã giảm giá mới (Admin)
 */
async function createCoupon(req, res, next) {
  try {
    const newCoupon = await couponService.createCoupon(req.body);
    return sendSuccess(res, newCoupon, 'Tạo mã giảm giá mới thành công', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật mã giảm giá (Admin)
 */
async function updateCoupon(req, res, next) {
  try {
    const { code } = req.params;
    const updated = await couponService.updateCoupon(code, req.body);
    return sendSuccess(res, updated, 'Cập nhật mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa mã giảm giá (Admin)
 */
async function deleteCoupon(req, res, next) {
  try {
    const { code } = req.params;
    const deleted = await couponService.deleteCoupon(code);
    return sendSuccess(res, deleted, 'Xóa mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActiveCoupons,
  getAllCouponsForAdmin,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
