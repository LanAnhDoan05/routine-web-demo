const categoryService = require('../services/categoryService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Lấy danh sách danh mục (hỗ trợ ?type=quick hoặc ?type=mega)
 */
async function getCategories(req, res, next) {
  try {
    const { type } = req.query;
    const result = await categoryService.getAllCategories({ type });
    return sendSuccess(res, result, 'Lấy danh sách danh mục thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy chi tiết một danh mục theo slug
 */
async function getCategoryBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);

    if (!category) {
      return sendError(res, `Không tìm thấy danh mục với slug: "${slug}"`, 404);
    }

    return sendSuccess(res, category, 'Lấy thông tin danh mục thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy danh sách toàn bộ phong cách thời trang (Styles)
 */
async function getStyles(req, res, next) {
  try {
    const styles = await categoryService.getAllStyles();
    return sendSuccess(res, styles, 'Lấy danh sách phong cách thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy chi tiết một phong cách theo slug
 */
async function getStyleBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const style = await categoryService.getStyleBySlug(slug);

    if (!style) {
      return sendError(res, `Không tìm thấy phong cách với slug: "${slug}"`, 404);
    }

    return sendSuccess(res, style, 'Lấy thông tin phong cách thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm danh mục mới (Admin)
 */
async function createCategory(req, res, next) {
  try {
    const newCategory = await categoryService.createCategory(req.body);
    return sendSuccess(res, newCategory, 'Thêm danh mục thành công', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật danh mục (Admin)
 */
async function updateCategory(req, res, next) {
  try {
    const { slug } = req.params;
    const updated = await categoryService.updateCategory(slug, req.body);
    return sendSuccess(res, updated, 'Cập nhật danh mục thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa danh mục (Admin)
 */
async function deleteCategory(req, res, next) {
  try {
    const { slug } = req.params;
    const deleted = await categoryService.deleteCategory(slug);
    return sendSuccess(res, deleted, 'Xóa danh mục thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  getCategoryBySlug,
  getStyles,
  getStyleBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
