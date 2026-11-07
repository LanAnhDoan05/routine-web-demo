const { sendError } = require('../utils/response');

/**
 * Validate số điện thoại Việt Nam cơ bản: 10 chữ số bắt đầu bằng 0 (hoặc +84)
 */
function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\.]/g, '');
  const regex = /^(0|\+84)[0-9]{9}$/;
  return regex.test(cleaned);
}

/**
 * Chuẩn hóa số điện thoại về định dạng 10 số (0xxxxxxxxx)
 */
function normalizePhoneNumber(phone) {
  if (!phone) return phone;
  let cleaned = phone.replace(/[\s\-\.]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

/**
 * Validate Email hợp lệ
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Middleware kiểm tra dữ liệu đăng ký: fullName, phoneNumber, email, password
 */
function validateRegister(req, res, next) {
  const { fullName, phoneNumber, email, password } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    return sendError(res, 'Họ và tên không hợp lệ (tối thiểu 2 ký tự)', 400);
  }

  if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
    return sendError(
      res,
      'Số điện thoại không hợp lệ (cần là số điện thoại 10 số, ví dụ 0912345678)',
      400
    );
  }

  if (!email || !isValidEmail(email)) {
    return sendError(res, 'Địa chỉ email không đúng định dạng', 400);
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return sendError(res, 'Mật khẩu phải có độ dài tối thiểu 6 ký tự', 400);
  }

  // Validate ngày tháng năm sinh nếu có cung cấp
  const rawDob = req.body.dateOfBirth || req.body.date || req.body.birthday || req.body.dob;
  if (rawDob) {
    const d = new Date(rawDob);
    const now = new Date();
    if (isNaN(d.getTime()) || d > now || d.getFullYear() < 1900) {
      return sendError(res, 'Ngày tháng năm sinh không hợp lệ (không được ở tương lai và phải sau năm 1900)', 400);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    req.body.dateOfBirth = formatted;
    req.body.date = formatted;
  }

  // Gán lại dữ liệu đã chuẩn hóa vào request
  req.body.fullName = fullName.trim();
  req.body.phoneNumber = normalizePhoneNumber(phoneNumber);
  req.body.email = email.trim().toLowerCase();

  next();
}

/**
 * Middleware kiểm tra dữ liệu đăng nhập: phoneNumber, password
 */
function validateLogin(req, res, next) {
  const { phoneNumber, phone, email, identifier, username, password } = req.body;
  const loginId = phoneNumber || phone || email || identifier || username;

  if (!loginId || typeof loginId !== 'string' || loginId.trim().length === 0) {
    return sendError(res, 'Vui lòng cung cấp số điện thoại hoặc email đăng nhập', 400);
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return sendError(res, 'Vui lòng cung cấp mật khẩu', 400);
  }

  req.body.phoneNumber = loginId.trim();

  next();
}

module.exports = {
  isValidPhoneNumber,
  normalizePhoneNumber,
  isValidEmail,
  validateRegister,
  validateLogin,
};
