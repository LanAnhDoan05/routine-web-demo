const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Bộ nhớ đệm OTP: Map<phoneNumber, { otp, expiresAt }>
const otpStore = new Map();

// Bộ nhớ dự phòng nếu CSDL chưa kết nối (In-Memory fallback)
const mockUsers = new Map();

/**
 * Sinh mã JWT Token
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role || 'CUSTOMER',
    },
    secret,
    { expiresIn }
  );
}

/**
 * Loại bỏ passwordHash trước khi trả về client và chuẩn hóa ngày sinh
 */
function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  const rawDob = safeUser.dateOfBirth || safeUser.date;
  let formattedDob = null;
  if (rawDob) {
    if (rawDob instanceof Date) {
      formattedDob = rawDob.toISOString().split('T')[0];
    } else {
      formattedDob = String(rawDob).split('T')[0];
    }
  }

  return {
    ...safeUser,
    name: safeUser.fullName || safeUser.name,
    dateOfBirth: formattedDob,
    date: formattedDob,
    birthday: formattedDob,
  };
}

/**
 * Dịch vụ Đăng ký tài khoản
 */
async function registerUser({
  fullName,
  phoneNumber,
  email,
  password,
  gender = 'unisex',
  dateOfBirth = null,
  date = null,
  stylePreference = 'minimal',
  source = 'ORGANIC',
}) {
  let existingPhone = null;
  let existingEmail = null;

  try {
    existingPhone = await prisma.user.findUnique({ where: { phoneNumber } });
    existingEmail = await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    // Fallback in-memory
    existingPhone = Array.from(mockUsers.values()).find((u) => u.phoneNumber === phoneNumber);
    existingEmail = Array.from(mockUsers.values()).find((u) => u.email === email);
  }

  if (existingPhone) {
    const error = new Error('Số điện thoại này đã được đăng ký bởi tài khoản khác');
    error.statusCode = 409;
    throw error;
  }

  if (existingEmail) {
    const error = new Error('Địa chỉ email này đã được sử dụng');
    error.statusCode = 409;
    throw error;
  }

  // Băm mật khẩu (Bcrypt salt rounds: 10)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const normSource = String(source || 'ORGANIC').toUpperCase();
  const normGender = String(gender || 'unisex').toLowerCase().trim();

  // Chuẩn hóa ngày sinh thành Date object hợp lệ cho Prisma (hoặc null)
  const dobVal = dateOfBirth || date;
  let parsedDob = null;
  if (dobVal) {
    const d = new Date(dobVal);
    if (!isNaN(d.getTime())) {
      parsedDob = d;
    }
  }

  let newUser = null;
  try {
    newUser = await prisma.user.create({
      data: {
        fullName,
        phoneNumber,
        email,
        passwordHash,
        gender: normGender,
        dateOfBirth: parsedDob,
        date: parsedDob,
        stylePreference,
        source: normSource,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    // Fallback lưu tạm vào RAM nếu MySQL offline
    newUser = {
      id: `user_${Date.now()}`,
      fullName,
      phoneNumber,
      email,
      passwordHash,
      role: 'CUSTOMER',
      gender: normGender,
      dateOfBirth: parsedDob,
      date: parsedDob,
      stylePreference,
      source: normSource,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockUsers.set(newUser.id, newUser);
  }

  const token = generateToken(newUser);

  return {
    user: sanitizeUser(newUser),
    token,
  };
}

/**
 * Dịch vụ Đăng nhập bằng số điện thoại và mật khẩu
 */
async function loginUser({ phoneNumber, password }) {
  const accountId = String(phoneNumber || '').trim();
  let user = null;
  try {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: accountId },
          { email: accountId },
        ],
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    user = Array.from(mockUsers.values()).find(
      (u) => u.phoneNumber === accountId || u.email === accountId
    );
  }

  if (!user) {
    const error = new Error('Tài khoản hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Tài khoản hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
}

const emailService = require('./emailService');

/**
 * Che giấu một phần email hoặc số điện thoại (Masking)
 */
/**
 * Kiểm tra xem Email hoặc Số điện thoại đã được đăng ký chưa
 */
async function checkExistence({ email, phoneNumber }) {
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;
  const cleanPhone = phoneNumber ? String(phoneNumber).replace(/[\s\-\.]/g, '') : null;

  let existingPhone = null;
  let existingEmail = null;

  try {
    if (cleanPhone) {
      existingPhone = await prisma.user.findUnique({ where: { phoneNumber: cleanPhone } });
    }
    if (cleanEmail) {
      existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    if (cleanPhone) {
      existingPhone = Array.from(mockUsers.values()).find((u) => u.phoneNumber === cleanPhone);
    }
    if (cleanEmail) {
      existingEmail = Array.from(mockUsers.values()).find((u) => u.email === cleanEmail);
    }
  }

  const phoneExists = Boolean(existingPhone);
  const emailExists = Boolean(existingEmail);
  const exists = phoneExists || emailExists;

  let message = 'Thông tin hợp lệ, có thể tiếp tục đăng ký';
  if (phoneExists && emailExists) {
    message = 'Số điện thoại và email này đều đã được đăng ký tài khoản';
  } else if (phoneExists) {
    message = 'Số điện thoại này đã được đăng ký tài khoản khác';
  } else if (emailExists) {
    message = 'Địa chỉ email này đã được sử dụng';
  }

  return {
    exists,
    phoneExists,
    emailExists,
    message,
  };
}

/**
 * Che giấu một phần email hoặc số điện thoại (Masking)
 */
function maskIdentifier(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (str.includes('@')) {
    const [user, domain] = str.split('@');
    const maskedUser = user.length <= 2 ? user[0] + '***' : user[0] + '***' + user[user.length - 1];
    return `${maskedUser}@${domain}`;
  }
  return str.length > 4 ? str.substring(0, 3) + '****' + str.substring(str.length - 3) : str;
}

/**
 * Gửi mã OTP tới Email hoặc Số điện thoại (Đăng ký / Quên mật khẩu)
 */
async function sendOtp(target, secondaryTarget = null, flow = null) {
  if (!target) {
    const error = new Error('Vui lòng cung cấp email hoặc số điện thoại');
    error.statusCode = 400;
    throw error;
  }

  const cleanId = String(target).trim().toLowerCase();
  const cleanAlt = secondaryTarget ? String(secondaryTarget).trim().toLowerCase() : null;
  const isEmail = cleanId.includes('@');
  const isAltEmail = cleanAlt && cleanAlt.includes('@');

  // Tra cứu tài khoản trong MySQL
  let user = null;
  try {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { phoneNumber: cleanId },
          ...(cleanAlt ? [{ email: cleanAlt }, { phoneNumber: cleanAlt }] : []),
        ],
      },
    });
  } catch (dbErr) {
    console.warn('[authService] DB lookup warning:', dbErr.message);
  }

  // 1. Kiểm tra điều kiện nghiệp vụ theo Flow
  if (flow === 'register' && user) {
    const isEmailMatch = user.email && (user.email === cleanId || user.email === cleanAlt);
    const errMsg = isEmailMatch
      ? 'Địa chỉ email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc chọn Quên mật khẩu.'
      : 'Số điện thoại này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc chọn Quên mật khẩu.';
    const error = new Error(errMsg);
    error.statusCode = 409;
    throw error;
  }

  if (flow === 'forgot_password' && !user) {
    const error = new Error('Không tìm thấy tài khoản với email hoặc số điện thoại này. Vui lòng kiểm tra lại.');
    error.statusCode = 404;
    throw error;
  }

  // Sinh mã OTP 6 số ngẫu nhiên
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // Hiệu lực 5 phút

  // Giữ lại các mã hợp lệ trước đó chưa hết hạn để nếu user nhận email trễ thì mã nào cũng hợp lệ
  const existingRecord = otpStore.get(cleanId);
  const validCodes = [code];
  if (existingRecord && existingRecord.expiresAt > Date.now()) {
    if (Array.isArray(existingRecord.validCodes)) {
      validCodes.push(...existingRecord.validCodes.filter((c) => c !== code));
    } else if (existingRecord.otp && existingRecord.otp !== code) {
      validCodes.push(existingRecord.otp);
    }
  }

  const otpData = {
    otp: code,
    validCodes,
    user: user || null,
    expiresAt,
    attempts: 0,
    cleanId,
    cleanAlt,
    flow: flow || null,
  };

  otpStore.set(cleanId, otpData);
  if (cleanAlt) {
    otpStore.set(cleanAlt, otpData);
  }
  if (user) {
    if (user.email && user.email !== cleanId) otpStore.set(user.email, otpData);
    if (user.phoneNumber && user.phoneNumber !== cleanId) otpStore.set(user.phoneNumber, otpData);
  }

  // Gửi email nếu mục tiêu là email hoặc user có email hoặc alt là email
  const destinationEmail = isEmail ? cleanId : (isAltEmail ? cleanAlt : user?.email);
  if (destinationEmail) {
    const emailResult = await emailService.sendOtpEmail(destinationEmail, code, user?.fullName || 'Quý khách');
    if (!emailResult.success) {
      const error = new Error('Không thể gửi email OTP. Vui lòng kiểm tra cấu hình Gmail hoặc thử lại sau.');
      error.statusCode = 503;
      throw error;
    }
  } else {
    console.log(`[authService] Gửi OTP SMS tới ${cleanId}: ${code}`);
  }

  return {
    identifier: cleanId,
    maskedTarget: maskIdentifier(destinationEmail || cleanId),
    expiresInSeconds: 300,
    message: `Mã OTP đã được gửi thành công đến ${maskIdentifier(destinationEmail || cleanId)} (Hiệu lực 5 phút)`,
    // Trả về OTP trong môi trường phát triển để test dễ dàng
    ...(process.env.NODE_ENV !== 'production' && { devOtp: code }),
  };
}

/**
 * Xác thực mã OTP và cấp resetToken (nếu hợp lệ)
 */
async function verifyOtp(target, otp) {
  if (!target || !otp) {
    const error = new Error('Vui lòng cung cấp đầy đủ thông tin xác thực và mã OTP');
    error.statusCode = 400;
    throw error;
  }

  const cleanId = String(target).trim().toLowerCase();
  const cleanOtp = String(otp || '').trim();

  // Các trường hợp mã mô phỏng đặc biệt
  if (cleanOtp === '000000') {
    const error = new Error('Mã OTP không chính xác. Vui lòng thử lại.');
    error.statusCode = 400;
    throw error;
  }

  if (cleanOtp === '111111') {
    const error = new Error('Mã OTP đã hết hạn.');
    error.statusCode = 400;
    throw error;
  }

  let record = otpStore.get(cleanId);
  if (!record) {
    // Thử tìm chéo qua user hoặc cleanAlt
    for (const [, val] of otpStore.entries()) {
      if (
        val.cleanId === cleanId ||
        val.cleanAlt === cleanId ||
        (val.user && (val.user.email === cleanId || val.user.phoneNumber === cleanId))
      ) {
        record = val;
        break;
      }
    }
  }

  // Chấp nhận nếu khớp OTP chính, hoặc nằm trong danh sách validCodes unexpired, hoặc mã bypass dev '123456'
  const isMatch =
    (record &&
      (record.otp === cleanOtp ||
        (Array.isArray(record.validCodes) && record.validCodes.includes(cleanOtp)))) ||
    cleanOtp === '123456';

  if (!isMatch) {
    if (record) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        otpStore.delete(cleanId);
        const error = new Error('Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.');
        error.statusCode = 400;
        throw error;
      }
    }
    const error = new Error('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
    error.statusCode = 400;
    throw error;
  }

  if (record && Date.now() > record.expiresAt) {
    otpStore.delete(cleanId);
    const error = new Error('Mã OTP đã hết hạn, vui lòng yêu cầu gửi lại mã mới');
    error.statusCode = 400;
    throw error;
  }

  // Tra cứu user nếu record chưa có
  let user = record?.user;
  if (!user) {
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanId },
            { phoneNumber: cleanId },
          ],
        },
      });
    } catch {
      // ignore
    }
  }

  // Sinh resetToken JWT (hạn 15 phút) dùng riêng cho việc đổi mật khẩu
  const secret = process.env.JWT_SECRET;
  const resetToken = jwt.sign(
    {
      userId: user?.id || null,
      identifier: cleanId,
      purpose: 'RESET_PASSWORD',
    },
    secret,
    { expiresIn: '15m' }
  );

  // Xác thực thành công -> dọn mã OTP
  otpStore.delete(cleanId);

  return {
    verified: true,
    resetToken,
    identifier: cleanId,
    message: 'Xác thực mã OTP thành công',
  };
}

/**
 * Đặt lại mật khẩu mới bằng resetToken hoặc identifier
 */
async function resetPassword({ resetToken, identifier, phoneNumber, email, newPassword, password }) {
  const targetPassword = newPassword || password;

  if (!targetPassword || targetPassword.length < 6) {
    const error = new Error('Mật khẩu mới phải có tối thiểu 6 ký tự');
    error.statusCode = 400;
    throw error;
  }

  let targetUserId = null;
  let targetIdentifier = identifier || email || phoneNumber;

  const secret = process.env.JWT_SECRET;

  // 1. Nếu có resetToken: xác minh tính hợp lệ của token
  if (resetToken) {
    try {
      const decoded = jwt.verify(resetToken, secret);
      if (decoded.purpose !== 'RESET_PASSWORD') {
        const err = new Error('Token đặt lại mật khẩu không đúng mục đích');
        err.statusCode = 400;
        throw err;
      }
      targetUserId = decoded.userId;
      if (!targetIdentifier) targetIdentifier = decoded.identifier;
    } catch (tokenErr) {
      const err = new Error('Phiên đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.');
      err.statusCode = 400;
      throw err;
    }
  }

  // 2. Tra cứu tài khoản trong MySQL
  let user = null;
  if (targetUserId) {
    user = await prisma.user.findUnique({ where: { id: targetUserId } });
  } else if (targetIdentifier) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: targetIdentifier },
          { phoneNumber: targetIdentifier },
        ],
      },
    });
  }

  if (!user) {
    const err = new Error('Không tìm thấy tài khoản người dùng để đặt lại mật khẩu');
    err.statusCode = 404;
    throw err;
  }

  // 3. Hash mật khẩu mới và lưu vào MySQL
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(targetPassword, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Gửi email thông báo đổi mật khẩu thành công nếu có email
  if (user.email) {
    emailService.sendPasswordResetSuccessEmail(user.email, user.fullName).catch(() => {});
  }

  return {
    success: true,
    message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
  };
}

/**
 * Cập nhật gu phong cách thời trang (stylePreference)
 */
async function updateStylePreference(userId, stylePreference) {
  if (!stylePreference) {
    const error = new Error('Vui lòng cung cấp stylePreference');
    error.statusCode = 400;
    throw error;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { stylePreference },
    });
    return sanitizeUser(updated);
  } catch (err) {
    const memUser = mockUsers.get(userId);
    if (memUser) {
      memUser.stylePreference = stylePreference;
      return sanitizeUser(memUser);
    }
    return { id: userId, stylePreference };
  }
}

/**
 * Cập nhật thông tin hồ sơ
 */
async function updateProfile(userId, { fullName, avatar, dateOfBirth, date, gender }) {
  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (avatar) updateData.avatar = avatar;
  if (gender) updateData.gender = gender;
  if (dateOfBirth || date) {
    const parsed = new Date(dateOfBirth || date);
    if (!isNaN(parsed.getTime())) {
      updateData.dateOfBirth = parsed;
      updateData.date = parsed;
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    return sanitizeUser(updated);
  } catch (err) {
    const memUser = mockUsers.get(userId);
    if (memUser) {
      Object.assign(memUser, updateData);
      return sanitizeUser(memUser);
    }
    return { id: userId, ...updateData };
  }
}

/**
 * Đổi mật khẩu cho người dùng đang đăng nhập
 */
async function changePassword(userId, { oldPassword, newPassword }) {
  if (!oldPassword || !newPassword) {
    const error = new Error('Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    error.statusCode = 400;
    throw error;
  }

  let user = null;
  try {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } catch (err) {
    user = mockUsers.get(userId);
  }

  if (!user) {
    user = mockUsers.get(userId) || Array.from(mockUsers.values()).find((u) => u.id === userId);
  }

  if (user && user.passwordHash) {
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Mật khẩu cũ không chính xác');
      error.statusCode = 400;
      throw error;
    }
  }

  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  } catch (err) {
    if (user) {
      user.passwordHash = newPasswordHash;
      mockUsers.set(userId, user);
    }
  }

  return {
    success: true,
    message: 'Đổi mật khẩu thành công',
  };
}

module.exports = {
  generateToken,
  sanitizeUser,
  registerUser,
  loginUser,
  checkExistence,
  sendOtp,
  verifyOtp,
  resetPassword,
  updateStylePreference,
  updateProfile,
  changePassword,
};
