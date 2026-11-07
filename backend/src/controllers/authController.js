const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Controller xử lý đăng ký tài khoản
 */
async function register(req, res, next) {
  try {
    const {
      fullName,
      phoneNumber,
      email,
      password,
      gender,
      dateOfBirth,
      date,
      birthday,
      stylePreference,
      source,
      attributionSource,
    } = req.body;

    const result = await authService.registerUser({
      fullName,
      phoneNumber,
      email,
      password,
      gender: gender || 'unisex',
      dateOfBirth: dateOfBirth || date || birthday || null,
      date: date || dateOfBirth || birthday || null,
      stylePreference,
      source: source || attributionSource || 'ORGANIC',
    });

    return sendSuccess(res, result, 'Đăng ký tài khoản thành công', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller xử lý đăng nhập tài khoản
 */
async function login(req, res, next) {
  try {
    const { phoneNumber, phone, email, identifier, username, password } = req.body;
    const loginIdentifier = phoneNumber || phone || email || identifier || username;

    const result = await authService.loginUser({
      phoneNumber: loginIdentifier,
      password,
    });

    return sendSuccess(res, result, 'Đăng nhập thành công', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller lấy thông tin tài khoản hiện tại
 */
async function getMe(req, res, next) {
  try {
    return sendSuccess(
      res,
      { user: req.user },
      'Lấy thông tin tài khoản thành công',
      200
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Kiểm tra xem Email hoặc Số điện thoại đã được đăng ký chưa
 */
async function checkExistence(req, res, next) {
  try {
    const { email, phoneNumber, phone } = req.body;
    const result = await authService.checkExistence({
      email,
      phoneNumber: phoneNumber || phone,
    });
    return sendSuccess(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * Gửi mã OTP (hỗ trợ cả Email và Số điện thoại)
 */
async function sendOtp(req, res, next) {
  try {
    const { identifier, email, phoneNumber, phone, flow, type } = req.body;
    const target = identifier || email || phoneNumber || phone;
    const secondary = (target === email) ? (phoneNumber || phone) : (email || null);
    const otpFlow = flow || type || null;

    const result = await authService.sendOtp(target, secondary, otpFlow);
    return sendSuccess(res, result, result.message || 'Mã OTP đã được gửi');
  } catch (error) {
    next(error);
  }
}

/**
 * Xác thực mã OTP
 */
async function verifyOtp(req, res, next) {
  try {
    const { identifier, email, phoneNumber, phone, otp } = req.body;
    const target = identifier || email || phoneNumber || phone;

    const result = await authService.verifyOtp(target, otp);
    return sendSuccess(res, result, 'Xác thực OTP thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Đặt lại mật khẩu mới
 */
async function resetPassword(req, res, next) {
  try {
    const { resetToken, identifier, email, phoneNumber, phone, password, newPassword } = req.body;

    const result = await authService.resetPassword({
      resetToken,
      identifier,
      email,
      phoneNumber: phoneNumber || phone,
      newPassword: newPassword || password,
    });
    return sendSuccess(res, result, 'Đặt lại mật khẩu thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật gu thời trang
 */
async function updateStylePreference(req, res, next) {
  try {
    const { stylePreference } = req.body;
    const updated = await authService.updateStylePreference(req.user.id || req.userId, stylePreference);
    return sendSuccess(res, updated, 'Cập nhật sở thích phong cách thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật thông tin hồ sơ
 */
async function updateProfile(req, res, next) {
  try {
    const { fullName, avatar, dateOfBirth, date, birthday, gender } = req.body;
    const updated = await authService.updateProfile(req.user.id || req.userId, {
      fullName,
      avatar,
      gender,
      dateOfBirth: dateOfBirth || date || birthday || null,
      date: date || dateOfBirth || birthday || null,
    });
    return sendSuccess(res, updated, 'Cập nhật hồ sơ thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Đổi mật khẩu
 */
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id || req.userId, {
      oldPassword,
      newPassword,
    });
    return sendSuccess(res, result, 'Đổi mật khẩu thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  checkExistence,
  sendOtp,
  verifyOtp,
  resetPassword,
  updateStylePreference,
  updateProfile,
  changePassword,
};
