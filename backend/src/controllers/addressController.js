const addressService = require('../services/addressService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy danh sách địa chỉ của người dùng
 */
async function getAddresses(req, res, next) {
  try {
    const list = await addressService.getAddresses(req.user.id || req.userId);
    return sendSuccess(res, list, 'Lấy danh sách địa chỉ thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm địa chỉ mới
 */
async function createAddress(req, res, next) {
  try {
    const newAddress = await addressService.createAddress(req.user.id || req.userId, req.body);
    return sendSuccess(res, newAddress, 'Thêm địa chỉ nhận hàng thành công', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật địa chỉ
 */
async function updateAddress(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await addressService.updateAddress(req.user.id || req.userId, id, req.body);
    return sendSuccess(res, updated, 'Cập nhật địa chỉ thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa địa chỉ
 */
async function deleteAddress(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await addressService.deleteAddress(req.user.id || req.userId, id);
    return sendSuccess(res, deleted, 'Xóa địa chỉ thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Đặt địa chỉ làm mặc định
 */
async function setDefaultAddress(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await addressService.setDefaultAddress(req.user.id || req.userId, id);
    return sendSuccess(res, updated, 'Đã đặt làm địa chỉ mặc định');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
