const vnpayService = require('../services/vnpayService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Khởi tạo URL thanh toán VNPay Sandbox
 */
async function createVNPayUrl(req, res, next) {
  try {
    const { orderId, amount, orderInfo, bankCode, locale } = req.body;

    if (!orderId) {
      return sendError(res, 'Vui lòng cung cấp mã đơn hàng (orderId)', 400);
    }

    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const result = await vnpayService.createPaymentUrl({
      orderId,
      amount,
      orderInfo,
      ipAddr,
      bankCode,
      locale,
      userId: req.userId,
      guestSessionId: req.identityId,
    });

    return sendSuccess(res, result, 'Tạo URL thanh toán VNPay thành công', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Xác thực dữ liệu trả về từ Return URL khi khách hàng được redirect về
 */
async function verifyVNPayReturn(req, res, next) {
  try {
    const result = await vnpayService.verifyReturnUrl(req.query);
    return sendSuccess(res, result, 'Xác thực kết quả thanh toán VNPay thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Xử lý webhook ngầm (IPN) từ server VNPay
 */
async function vnpayIpn(req, res, next) {
  try {
    const result = await vnpayService.processIpn(req.query);
    // VNPay yêu cầu định dạng response chuẩn { RspCode: '...', Message: '...' }
    return res.status(200).json(result);
  } catch (error) {
    console.error('[paymentController] vnpayIpn Exception:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
}

module.exports = {
  createVNPayUrl,
  verifyVNPayReturn,
  vnpayIpn,
};
