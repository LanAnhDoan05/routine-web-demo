const styleService = require('../services/styleService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy danh sách phong cách
 */
async function getStyles(req, res) {
  try {
    const { status } = req.query;
    const styles = await styleService.getAllStyles({ status });
    return sendSuccess(res, styles, 'Lấy danh sách phong cách thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Lấy số lượng sản phẩm gắn với từng phong cách
 */
async function getStyleProductCounts(req, res) {
  try {
    const counts = await styleService.getStyleProductCounts();
    return sendSuccess(res, counts, 'Lấy thống kê sản phẩm theo phong cách thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Lấy chi tiết phong cách
 */
async function getStyleByIdOrSlug(req, res) {
  try {
    const { idOrSlug } = req.params;
    const style = await styleService.getStyleByIdOrSlug(idOrSlug);
    if (!style) {
      return sendError(res, 'Không tìm thấy phong cách', 404);
    }
    return sendSuccess(res, style, 'Lấy chi tiết phong cách thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Thêm mới phong cách (Admin)
 */
async function createStyle(req, res) {
  try {
    const newStyle = await styleService.createStyle(req.body);
    return sendSuccess(res, newStyle, 'Tạo phong cách mới thành công', 201);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Cập nhật phong cách (Admin)
 */
async function updateStyle(req, res) {
  try {
    const { idOrSlug } = req.params;
    const updated = await styleService.updateStyle(idOrSlug, req.body);
    return sendSuccess(res, updated, 'Cập nhật phong cách thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

/**
 * Xóa phong cách (Admin)
 */
async function deleteStyle(req, res) {
  try {
    const { idOrSlug } = req.params;
    const result = await styleService.deleteStyle(idOrSlug);
    return sendSuccess(res, result, 'Xóa phong cách thành công');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

module.exports = {
  getStyles,
  getStyleProductCounts,
  getStyleByIdOrSlug,
  createStyle,
  updateStyle,
  deleteStyle,
};
