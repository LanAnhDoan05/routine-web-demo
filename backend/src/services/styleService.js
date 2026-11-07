const prisma = require('../config/prisma');
const { processSingleImage } = require('../utils/fileStorage');

function slugify(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function mapStyle(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    image: row.image || '',
    imageUrl: row.image || '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Lấy toàn bộ danh sách phong cách từ MySQL database
 */
async function getAllStyles({ status } = {}) {
  try {
    let rows;
    if (status && status !== 'ALL') {
      rows = await prisma.$queryRawUnsafe(
        `SELECT * FROM styles WHERE status = ? ORDER BY created_at DESC;`,
        status.toUpperCase()
      );
    } else {
      rows = await prisma.$queryRawUnsafe(
        `SELECT * FROM styles ORDER BY created_at DESC;`
      );
    }
    return rows.map(mapStyle);
  } catch (err) {
    console.error('[styleService] getAllStyles failed:', err.message);
    return [];
  }
}

/**
 * Lấy chi tiết phong cách theo ID hoặc Slug từ MySQL
 */
async function getStyleByIdOrSlug(idOrSlug) {
  if (!idOrSlug) return null;
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM styles WHERE id = ? OR slug = ? LIMIT 1;`,
      idOrSlug,
      idOrSlug
    );
    if (!rows || rows.length === 0) return null;
    return mapStyle(rows[0]);
  } catch (err) {
    console.error(`[styleService] getStyleByIdOrSlug ${idOrSlug} failed:`, err.message);
    return null;
  }
}

/**
 * Thống kê số lượng sản phẩm gắn với từng style từ MySQL
 */
async function getStyleProductCounts() {
  const counts = {};
  const stylesList = await getAllStyles();
  stylesList.forEach((s) => {
    counts[s.id] = 0;
    if (s.slug) counts[s.slug] = 0;
  });

  const dbProducts = await prisma.product.findMany({ select: { styles: true } });
  dbProducts.forEach((p) => {
    let pStyles = [];
    if (Array.isArray(p.styles)) {
      pStyles = p.styles;
    } else if (typeof p.styles === 'string') {
      try {
        pStyles = JSON.parse(p.styles || '[]');
      } catch {
        pStyles = [p.styles];
      }
    }
    pStyles.forEach((st) => {
      const matched = stylesList.find((s) => s.id === st || s.slug === st);
      if (matched) {
        counts[matched.id] = (counts[matched.id] || 0) + 1;
        counts[matched.slug] = (counts[matched.slug] || 0) + 1;
      } else {
        counts[st] = (counts[st] || 0) + 1;
      }
    });
  });

  return counts;
}

/**
 * Tạo mới phong cách thời trang (Admin) - Lưu trực tiếp vào MySQL
 */
async function createStyle(styleData) {
  const { name, slug, description = '', image, imageUrl, status = 'ACTIVE' } = styleData;

  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Tên phong cách không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const generatedSlug = slug ? slug.trim().toLowerCase() : slugify(name);
  const existing = await prisma.$queryRawUnsafe(
    `SELECT id FROM styles WHERE slug = ? OR name = ? LIMIT 1;`,
    generatedSlug,
    name.trim()
  );

  if (existing && existing.length > 0) {
    const error = new Error(`Phong cách với slug "${generatedSlug}" hoặc tên này đã tồn tại`);
    error.statusCode = 409;
    throw error;
  }

  const newId = `style-${generatedSlug}`;
  const rawImage = imageUrl || image || '/images/styles/basic.svg';
  const img = processSingleImage(rawImage, `style_${generatedSlug}`);

  await prisma.$queryRawUnsafe(
    `INSERT INTO styles (id, slug, name, description, image, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW());`,
    newId,
    generatedSlug,
    name.trim(),
    description.trim(),
    img,
    status.toUpperCase()
  );

  return await getStyleByIdOrSlug(newId);
}

/**
 * Cập nhật phong cách (Admin) - Cập nhật trực tiếp vào MySQL
 */
async function updateStyle(idOrSlug, updateData) {
  if (!idOrSlug) {
    const error = new Error('Thiếu định danh phong cách');
    error.statusCode = 400;
    throw error;
  }

  const current = await getStyleByIdOrSlug(idOrSlug);
  if (!current) {
    const error = new Error(`Không tìm thấy phong cách với mã hoặc slug "${idOrSlug}"`);
    error.statusCode = 404;
    throw error;
  }

  const nextName = updateData.name ? updateData.name.trim() : current.name;
  let nextSlug = current.slug;

  if (updateData.slug) {
    nextSlug = updateData.slug.trim().toLowerCase();
  } else if (updateData.name && updateData.name !== current.name) {
    nextSlug = slugify(updateData.name);
  }

  // Kiểm tra trùng slug với style khác
  const duplicate = await prisma.$queryRawUnsafe(
    `SELECT id FROM styles WHERE (slug = ? OR id = ?) AND id != ? LIMIT 1;`,
    nextSlug,
    `style-${nextSlug}`,
    current.id
  );
  if (duplicate && duplicate.length > 0) {
    const error = new Error(`Slug "${nextSlug}" đã bị sử dụng bởi phong cách khác`);
    error.statusCode = 409;
    throw error;
  }

  const nextDesc = updateData.description !== undefined ? updateData.description.trim() : current.description;
  const rawImage = updateData.imageUrl !== undefined ? updateData.imageUrl : (updateData.image !== undefined ? updateData.image : current.image);
  const nextImg = (updateData.imageUrl !== undefined || updateData.image !== undefined)
    ? processSingleImage(rawImage, `style_${current.id}`)
    : (current.image || '');
  const nextStatus = (updateData.status || current.status || 'ACTIVE').toUpperCase();

  await prisma.$queryRawUnsafe(
    `UPDATE styles SET name = ?, slug = ?, description = ?, image = ?, status = ?, updated_at = NOW() WHERE id = ?;`,
    nextName,
    nextSlug,
    nextDesc,
    nextImg,
    nextStatus,
    current.id
  );

  return await getStyleByIdOrSlug(current.id);
}

/**
 * Xóa phong cách (Admin) - Xóa trực tiếp khỏi MySQL
 */
async function deleteStyle(idOrSlug) {
  if (!idOrSlug) {
    const error = new Error('Thiếu định danh phong cách cần xóa');
    error.statusCode = 400;
    throw error;
  }

  const current = await getStyleByIdOrSlug(idOrSlug);
  if (!current) {
    const error = new Error(`Không tìm thấy phong cách với mã "${idOrSlug}"`);
    error.statusCode = 404;
    throw error;
  }

  await prisma.$queryRawUnsafe(`DELETE FROM styles WHERE id = ?;`, current.id);
  return {
    success: true,
    message: `Đã xóa phong cách "${current.name}" thành công`,
    deletedStyle: current,
  };
}

module.exports = {
  getAllStyles,
  getStyleByIdOrSlug,
  getStyleProductCounts,
  createStyle,
  updateStyle,
  deleteStyle,
};
