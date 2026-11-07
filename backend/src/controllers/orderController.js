const orderService = require('../services/orderService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Tạo đơn hàng mới
 */
async function createOrder(req, res, next) {
  try {
    const orderInput = req.body;
    const newOrder = await orderService.createOrder(req.identityId, orderInput);
    return sendSuccess(res, newOrder, 'Đặt hàng thành công', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy danh sách đơn hàng của khách
 */
async function getOrders(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await orderService.getOrders({
      identityId: req.identityId,
      status,
      page,
      limit,
    });
    return sendSuccess(res, result, 'Lấy danh sách đơn hàng thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy chi tiết đơn hàng
 */
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);

    if (!order) {
      return sendError(res, `Không tìm thấy đơn hàng với mã "${id}"`, 404);
    }

    return sendSuccess(res, order, 'Lấy thông tin đơn hàng thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Hủy đơn hàng
 */
async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const updatedOrder = await orderService.cancelOrder(id);
    return sendSuccess(res, updatedOrder, 'Hủy đơn hàng thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Mua lại đơn hàng cũ
 */
async function reorder(req, res, next) {
  try {
    const { id } = req.params;
    const cart = await orderService.reorder(id, req.identityId);
    return sendSuccess(res, cart, 'Đã thêm toàn bộ sản phẩm của đơn hàng vào giỏ');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy toàn bộ đơn hàng của tất cả khách hàng (Admin)
 */
async function getAllOrdersForAdmin(req, res, next) {
  try {
    const { status, page, limit, search, source, paymentStatus, customerType } = req.query;
    const result = await orderService.getAllOrdersForAdmin({
      status,
      page,
      limit,
      search,
      source,
      paymentStatus,
      customerType,
    });
    return sendSuccess(res, result, 'Lấy danh sách toàn bộ đơn hàng thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật trạng thái đơn hàng (Admin)
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (!status && !paymentStatus) {
      return sendError(res, 'Vui lòng cung cấp trạng thái mới (status hoặc paymentStatus)', 400);
    }

    const updated = await orderService.updateOrderStatus(id, status, paymentStatus);
    return sendSuccess(res, updated, 'Cập nhật trạng thái đơn hàng thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy trạng thái giữ tồn kho của đơn hàng (thời gian còn lại trong 5 phút)
 */
async function getHoldStatus(req, res, next) {
  try {
    const { id } = req.params;
    const holdStatus = await orderService.getOrderHoldStatus(id);
    return sendSuccess(res, holdStatus, 'Lấy trạng thái giữ hàng thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Gửi hoặc gửi lại hóa đơn đơn hàng qua Email
 */
async function sendOrderInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const { email } = req.body || {};
    const result = await orderService.sendOrderInvoice(id, email);
    return sendSuccess(res, result, 'Gửi hóa đơn đơn hàng qua email thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  reorder,
  getAllOrdersForAdmin,
  updateOrderStatus,
  getHoldStatus,
  sendOrderInvoice,
};

