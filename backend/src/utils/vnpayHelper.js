const crypto = require('crypto');
const qs = require('qs');

/**
 * Loại bỏ dấu tiếng Việt và ký tự đặc biệt cho nội dung thanh toán (vnp_OrderInfo)
 */
function removeVietnameseTones(str) {
  if (!str) return 'Thanh toan don hang';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-zA-Z0-9 _-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sắp xếp các thuộc tính của object theo thứ tự alphabet A-Z (theo chuẩn VNPay)
 */
function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;

  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }

  str.sort();

  for (key = 0; key < str.length; key++) {
    const rawVal = obj[str[key]];
    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
      sorted[str[key]] = encodeURIComponent(String(rawVal)).replace(/%20/g, '+');
    }
  }

  return sorted;
}

/**
 * Tạo chữ ký HMAC-SHA512 cho dữ liệu VNPay
 */
function createSecureHash(params, secretKey) {
  const sortedParams = sortObject(params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

/**
 * Kiểm tra tính hợp lệ của chữ ký phản hồi từ VNPay
 */
function verifySecureHash(queryParams, secretKey) {
  const params = { ...queryParams };
  const secureHash = params['vnp_SecureHash'] || params['vnp_secure_hash'];

  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];
  delete params['vnp_secure_hash'];

  const calculatedHash = createSecureHash(params, secretKey);
  return (
    Boolean(secureHash) &&
    calculatedHash.toLowerCase() === String(secureHash).toLowerCase()
  );
}

/**
 * Định dạng ngày theo chuẩn VNPay YYYYMMDDHHmmss (14 chữ số)
 */
function formatVNPayDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Tra cứu ý nghĩa mã phản hồi VNPay
 */
const VNPAY_RESPONSE_CODES = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
  '09': 'Giao dịch không thành công: Thẻ/Tài khoản chưa đăng ký InternetBanking',
  '10': 'Giao dịch không thành công: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Giao dịch không thành công: Đã hết hạn chờ thanh toán',
  '12': 'Giao dịch không thành công: Thẻ/Tài khoản của khách hàng bị khóa',
  '13': 'Giao dịch không thành công: Nhập sai mật khẩu xác thực giao dịch (OTP)',
  '24': 'Giao dịch không thành công: Khách hàng hủy giao dịch',
  '51': 'Giao dịch không thành công: Tài khoản không đủ số dư để thực hiện giao dịch',
  '65': 'Giao dịch không thành công: Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Giao dịch không thành công: Nhập sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Giao dịch không thành công: Lỗi không xác định từ cổng thanh toán',
};

function getVNPayResponseMessage(responseCode) {
  return VNPAY_RESPONSE_CODES[responseCode] || `Lỗi giao dịch (Mã: ${responseCode})`;
}

module.exports = {
  removeVietnameseTones,
  sortObject,
  createSecureHash,
  verifySecureHash,
  formatVNPayDate,
  getVNPayResponseMessage,
  VNPAY_RESPONSE_CODES,
};
