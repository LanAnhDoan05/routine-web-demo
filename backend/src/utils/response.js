/**
 * Chuẩn hóa format phản hồi cho Frontend (Next.js)
 */
function sendSuccess(res, data = null, message = 'Thành công', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
  });
}

function sendError(res, message = 'Đã có lỗi xảy ra', statusCode = 500, details = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: details,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
