const jwt = require('jsonwebtoken');

/**
 * Middleware định danh người dùng (User hoặc Guest)
 * Giúp các module Cart và Wishlist phục vụ được cả khách vãng lai và thành viên đã đăng nhập
 */
function identifyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const secret = process.env.JWT_SECRET;

    // 1. Kiểm tra JWT Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, secret);
        const targetUserId = decoded.userId || decoded.id;
        req.user = decoded;
        req.userId = targetUserId;
        req.isAuth = true;
        req.identityId = targetUserId;
        return next();
      } catch (err) {
        // Token không hợp lệ hoặc hết hạn: bỏ qua để chuyển sang định danh khách
      }
    }

    // 2. Kiểm tra Guest Session
    const sessionId =
      req.headers['x-session-id'] ||
      req.headers['x-guest-id'] ||
      req.query?.sessionId ||
      req.cookies?.routine_session_id;

    if (sessionId) {
      const cleanSessionId = String(sessionId).trim().replace(/^(guest_)+/, '');
      req.identityId = `guest_${cleanSessionId}`;
      req.sessionId = cleanSessionId;
      req.isAuth = false;
      return next();
    }

    // 3. Tự động sinh session id duy nhất cho khách vãng lai (không gộp chung IP)
    const crypto = require('crypto');
    const newGuestId = 'g_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 12) + Date.now().toString(36));
    req.identityId = `guest_${newGuestId}`;
    req.sessionId = newGuestId;
    req.isAuth = false;

    // Gắn session id vào header để client lưu trữ lại
    res.setHeader('x-session-id', newGuestId);
    if (res.cookie) {
      res.cookie('routine_session_id', newGuestId, { maxAge: 30 * 24 * 3600 * 1000, httpOnly: false });
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = identifyUser;
