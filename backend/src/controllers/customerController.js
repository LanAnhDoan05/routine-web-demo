const customerService = require('../services/customerService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy danh sách khách hàng (Admin)
 */
async function getCustomers(req, res) {
  try {
    const { page, limit, search, status, source, sortBy } = req.query;
    const result = await customerService.getAllCustomers({ page, limit, search, status, source, sortBy });
    return sendSuccess(res, result, 'Lấy danh sách khách hàng thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Lấy chi tiết một khách hàng
 */
async function getCustomerById(req, res) {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    return sendSuccess(res, customer, 'Lấy thông tin khách hàng thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Cập nhật trạng thái khách hàng (Khóa / Kích hoạt)
 */
async function updateCustomerStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await customerService.updateCustomerStatus(id, status);
    return sendSuccess(res, result, 'Cập nhật trạng thái khách hàng thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 400);
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
};
