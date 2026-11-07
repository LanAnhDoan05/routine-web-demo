const storeService = require('../services/storeService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy danh sách cửa hàng
 */
async function getStores(req, res) {
  try {
    const { region, city, status, search, q } = req.query;
    const stores = await storeService.getAllStores({
      region,
      city,
      status,
      search: search || q,
    });
    return sendSuccess(res, stores, 'Lấy danh sách cửa hàng thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Thống kê tổng quan hệ thống cửa hàng
 */
async function getStoreStats(req, res) {
  try {
    const stats = await storeService.getStoreStats();
    return sendSuccess(res, stats, 'Lấy thống kê cửa hàng thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Lấy chi tiết cửa hàng theo ID hoặc slug
 */
async function getStoreById(req, res) {
  try {
    const { id } = req.params;
    const store = await storeService.getStoreByIdOrSlug(id);
    if (!store) {
      return sendError(res, 'Không tìm thấy cửa hàng', 404);
    }
    return sendSuccess(res, store, 'Lấy thông tin cửa hàng thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Tạo mới cửa hàng (Admin)
 */
async function createStore(req, res) {
  try {
    const newStore = await storeService.createStore(req.body);
    return sendSuccess(res, newStore, 'Thêm mới cửa hàng thành công', 201);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Cập nhật thông tin cửa hàng (Admin)
 */
async function updateStore(req, res) {
  try {
    const { id } = req.params;
    const updated = await storeService.updateStore(id, req.body);
    return sendSuccess(res, updated, 'Cập nhật cửa hàng thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Bật/tắt trạng thái hoạt động của cửa hàng (Admin)
 */
async function toggleStoreStatus(req, res) {
  try {
    const { id } = req.params;
    const updated = await storeService.toggleStoreStatus(id);
    return sendSuccess(res, updated, `Đã ${updated.isActive ? 'kích hoạt' : 'tạm dừng'} hoạt động cửa hàng`);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Xóa cửa hàng (Admin)
 */
async function deleteStore(req, res) {
  try {
    const { id } = req.params;
    const deleted = await storeService.deleteStore(id);
    return sendSuccess(res, deleted, 'Xóa cửa hàng thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Khôi phục lại 25 cửa hàng mẫu mặc định (Admin)
 */
async function resetDefaultStores(req, res) {
  try {
    const { spawn } = require('child_process');
    const path = require('path');
    const scriptPath = path.join(__dirname, '../../scripts/setup_and_seed_stores.js');

    const proc = spawn(process.execPath, [scriptPath]);
    proc.on('close', async (code) => {
      if (code === 0) {
        const list = await storeService.getAllStores();
        return sendSuccess(res, list, 'Khôi phục 25 cửa hàng mẫu thành công');
      } else {
        return sendError(res, 'Lỗi khi khôi phục dữ liệu cửa hàng', 500);
      }
    });
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

module.exports = {
  getStores,
  getStoreStats,
  getStoreById,
  createStore,
  updateStore,
  toggleStoreStatus,
  deleteStore,
  resetDefaultStores,
};
