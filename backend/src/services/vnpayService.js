const qs = require('qs');
const prisma = require('../config/prisma');
const config = require('../config/vnpay');
const stockReservationService = require('./stockReservationService');
const cartService = require('./cartService');
const emailService = require('./emailService');
const {
  removeVietnameseTones,
  sortObject,
  createSecureHash,
  verifySecureHash,
  formatVNPayDate,
  getVNPayResponseMessage,
} = require('../utils/vnpayHelper');

/**
 * Tạo URL thanh toán VNPay Sandbox
 */
async function createPaymentUrl({
  orderId,
  amount,
  orderInfo,
  ipAddr = '127.0.0.1',
  bankCode = '',
  locale = 'vn',
  userId,
  guestSessionId,
}) {
  if (!orderId) {
    const err = new Error('Thiếu mã đơn hàng (orderId)');
    err.statusCode = 400;
    throw err;
  }

  // Tra cứu đơn hàng trong database nếu có
  let finalAmount = amount;
  let existingOrder = null;

  try {
    existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });
  } catch (dbErr) {
    console.warn('[vnpayService] Không thể truy vấn database cho orderId:', orderId, dbErr.message);
  }

  if (existingOrder) {
    const ownsOrder = (userId && existingOrder.userId === userId)
      || (guestSessionId && existingOrder.guestSessionId === guestSessionId);
    if (!ownsOrder) {
      const err = new Error('Bạn không có quyền thanh toán đơn hàng này');
      err.statusCode = 403;
      throw err;
    }
    finalAmount = existingOrder.total;
  }

  if (!finalAmount || Number(finalAmount) <= 0) {
    const err = new Error('Số tiền thanh toán không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  // Chuẩn hóa địa chỉ IP: VNPay Sandbox bắt buộc định dạng IPv4 chuẩn (A.B.C.D)
  // Khi chạy trên Vercel/Cloudflare, x-forwarded-for thường là IPv6 hoặc danh sách IP phân tách bởi dấu phẩy
  let cleanIp = ipAddr ? String(ipAddr).split(',')[0].trim() : '127.0.0.1';
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.replace('::ffff:', '');
  }
  const ipv4Pattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (!ipv4Pattern.test(cleanIp) || cleanIp === '::1') {
    cleanIp = '127.0.0.1';
  }

  const createDate = formatVNPayDate(new Date());
  const cleanOrderInfo = removeVietnameseTones(orderInfo || `Thanh toan don hang ${orderId}`).slice(0, 200);

  const vnpParams = {
    vnp_Version: config.vnp_Version,
    vnp_Command: config.vnp_Command,
    vnp_TmnCode: config.vnp_TmnCode,
    vnp_Locale: locale || 'vn',
    vnp_CurrCode: config.vnp_CurrCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: cleanOrderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(Number(finalAmount) * 100),
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: cleanIp,
    vnp_CreateDate: createDate,
  };

  if (bankCode) {
    vnpParams['vnp_BankCode'] = bankCode;
  }

  const sortedParams = sortObject(vnpParams);
  const secureHash = createSecureHash(vnpParams, config.vnp_HashSecret);
  sortedParams['vnp_SecureHash'] = secureHash;

  const paymentUrl = `${config.vnp_Url}?${qs.stringify(sortedParams, {
    encode: false,
  })}`;

  return {
    orderId,
    amount: Number(finalAmount),
    paymentUrl,
    vnpTxnRef: orderId,
    createDate,
  };
}

/**
 * Xác thực dữ liệu trả về từ Return URL
 */
async function verifyReturnUrl(queryParams) {
  const isValid = verifySecureHash(queryParams, config.vnp_HashSecret);

  if (!isValid) {
    return {
      valid: false,
      success: false,
      message: 'Chữ ký không hợp lệ hoặc dữ liệu giao dịch có dấu hiệu bị can thiệp',
      responseCode: queryParams.vnp_ResponseCode || '97',
    };
  }

  const rawOrderId = queryParams.vnp_TxnRef || '';
  const orderId = rawOrderId.split('__')[0];
  const responseCode = queryParams.vnp_ResponseCode || '';
  const transactionNo = queryParams.vnp_TransactionNo || '';
  const bankCode = queryParams.vnp_BankCode || '';
  const payDate = queryParams.vnp_PayDate || '';
  const amount = Number(queryParams.vnp_Amount || 0) / 100;
  const isSuccess = responseCode === '00';
  const message = getVNPayResponseMessage(responseCode);

  let updatedOrder = null;

  if (orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (order) {
        const updateData = {};
        if (isSuccess) {
          updateData.paymentStatus = 'PAID';
          updateData.orderStatus = 'CONFIRMED';
          // Commit stock trừ kho vĩnh viễn và dọn dẹp giỏ hàng
          await stockReservationService.commitStock(orderId);

          // Cập nhật số lượng đã bán thực tế vào database cho các sản phẩm trong đơn
          try {
            const orderItems = await prisma.orderItem.findMany({ where: { orderId } });
            for (const it of orderItems) {
              if (it.productId) {
                await prisma.product
                  .update({
                    where: { id: it.productId },
                    data: { soldCount: { increment: it.quantity } },
                  })
                  .catch(() => {});
              }
            }
          } catch (soldErr) {
            console.warn('[vnpayService] Lỗi cập nhật soldCount:', soldErr.message);
          }

          if (order.userId || order.guestSessionId) {
            try {
              cartService.clearCart(order.userId || order.guestSessionId);
            } catch (cartErr) {
              console.warn('[vnpayService] Lỗi clearCart sau khi thanh toán thành công:', cartErr.message);
            }
          }
        } else {
          // Thanh toán thất bại hoặc người dùng hủy: giải phóng tồn kho đã giữ
          await stockReservationService.releaseStock(orderId);
          updateData.paymentStatus = 'FAILED';
          updateData.orderStatus = 'CANCELLED';
          // CHÚ Ý QUAN TRỌNG: Không xóa giỏ hàng để khách hàng có thể tiếp tục mua sắm / thử lại
        }

        const transNote = `[VNPay ${transactionNo || 'N/A'} - Bank: ${bankCode || 'NCB'}]`;
        if (!order.note || !order.note.includes(transactionNo)) {
          updateData.note = order.note ? `${order.note} | ${transNote}` : transNote;
        }

        if (Object.keys(updateData).length > 0) {
          updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: { items: true, user: true },
          });

          // Tự động gửi Email hóa đơn xác nhận thanh toán trực tuyến thành công
          if (isSuccess && updatedOrder) {
            const customerEmail = updatedOrder.user ? updatedOrder.user.email : null;
            if (customerEmail) {
              setImmediate(async () => {
                try {
                  await emailService.sendOrderInvoiceEmail({
                    order: updatedOrder,
                    customerEmail,
                    customerName: updatedOrder.receiverName || (updatedOrder.user && updatedOrder.user.fullName),
                  });
                } catch (emErr) {
                  console.error('[vnpayService] Lỗi gửi email hóa đơn VNPay:', emErr.message);
                }
              });
            }
          }
        }
      }
    } catch (dbErr) {
      console.error('[vnpayService] Lỗi cập nhật trạng thái đơn hàng:', dbErr.message);
    }
  }

  return {
    valid: true,
    success: isSuccess,
    orderId,
    responseCode,
    transactionNo,
    bankCode,
    amount,
    payDate,
    message,
    order: updatedOrder,
  };
}

/**
 * Xử lý webhook IPN (Server-to-Server) theo chuẩn của VNPay
 */
async function processIpn(queryParams) {
  const isValid = verifySecureHash(queryParams, config.vnp_HashSecret);

  if (!isValid) {
    return { RspCode: '97', Message: 'Checksum failed' };
  }

  const rawOrderId = queryParams.vnp_TxnRef || '';
  const orderId = rawOrderId.split('__')[0];
  const responseCode = queryParams.vnp_ResponseCode;
  const vnpAmount = Number(queryParams.vnp_Amount || 0) / 100;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    if (Math.abs(order.total - vnpAmount) > 10) {
      return { RspCode: '04', Message: 'Amount invalid' };
    }

    if (order.paymentStatus === 'PAID') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    if (responseCode === '00') {
      await stockReservationService.commitStock(orderId);
      if (order.userId || order.guestSessionId) {
        try {
          cartService.clearCart(order.userId || order.guestSessionId);
        } catch (cartErr) {
          console.warn('[vnpayService] IPN clearCart warning:', cartErr.message);
        }
      }
      const updatedIpnOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          note: order.note
            ? `${order.note} | IPN Confirmed ${queryParams.vnp_TransactionNo}`
            : `IPN Confirmed ${queryParams.vnp_TransactionNo}`,
        },
        include: { items: true, user: true },
      });

      const customerEmail = updatedIpnOrder.user ? updatedIpnOrder.user.email : null;
      if (customerEmail) {
        setImmediate(async () => {
          try {
            await emailService.sendOrderInvoiceEmail({
              order: updatedIpnOrder,
              customerEmail,
              customerName: updatedIpnOrder.receiverName || (updatedIpnOrder.user && updatedIpnOrder.user.fullName),
            });
          } catch (emErr) {
            console.error('[vnpayService] Lỗi gửi email hóa đơn qua IPN:', emErr.message);
          }
        });
      }
    } else {
      await stockReservationService.releaseStock(orderId);
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
          orderStatus: 'CANCELLED',
          note: order.note
            ? `${order.note} | IPN Failed ${queryParams.vnp_TransactionNo || ''}`
            : `IPN Failed ${queryParams.vnp_TransactionNo || ''}`,
        },
      });
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  } catch (error) {
    console.error('[vnpayService] IPN Error:', error);
    return { RspCode: '99', Message: 'Unknown error' };
  }
}

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
  processIpn,
};
