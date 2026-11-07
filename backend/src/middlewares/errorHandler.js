const { sendError } = require('../utils/response');

/**
 * Middleware bắt và chuẩn hóa lỗi toàn hệ thống
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Details]:', err);

  // Lỗi Prisma (Unique constraint violation)
  if (err.code === 'P2002') {
    const target = err.meta?.target || 'dữ liệu';
    return sendError(
      res,
      `Giá trị '${target}' đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.`,
      409,
      err.meta
    );
  }

  // Lỗi cú pháp JSON không hợp lệ từ body request
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Dữ liệu JSON gửi lên không đúng định dạng', 400);
  }

  // Lỗi mặc định
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Lỗi hệ thống máy chủ';
  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
}

module.exports = errorHandler;
