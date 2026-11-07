const prisma = require('../config/prisma');
const path = require('path');

let tableEnsured = false;

/**
 * Đảm bảo bảng media_files luôn tồn tại trong MySQL
 */
async function ensureMediaTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS media_files (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INT NOT NULL,
        data LONGBLOB NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_media_filename (filename)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn('[mediaService] ensureMediaTable warning:', err.message);
  }
}

/**
 * Lưu file ảnh trực tiếp vào MySQL (hỗ trợ môi trường Serverless / Vercel không có ổ cứng ghi)
 */
async function saveMediaFile({ filename, mimetype, size, buffer, id = null }) {
  await ensureMediaTable();

  const ext = path.extname(filename || '').toLowerCase() || '.jpg';
  const cleanId = id || `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const fileSize = size || (buffer ? buffer.length : 0);

  if (!buffer || buffer.length === 0) {
    throw new Error('Dữ liệu file trống, không thể lưu vào cơ sở dữ liệu');
  }

  // Sử dụng raw query để truyền Buffer trực tiếp vào LONGBLOB an toàn và tương thích cao
  await prisma.$executeRawUnsafe(
    `INSERT INTO media_files (id, filename, mimetype, size, data, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE filename = VALUES(filename), mimetype = VALUES(mimetype), size = VALUES(size), data = VALUES(data);`,
    cleanId,
    filename || cleanId,
    mimetype || 'image/jpeg',
    fileSize,
    buffer
  );

  return {
    id: cleanId,
    filename: filename || cleanId,
    mimetype: mimetype || 'image/jpeg',
    size: fileSize,
    url: `/api/v1/media/${cleanId}`,
  };
}

/**
 * Lấy file ảnh từ MySQL theo ID hoặc tên file
 */
async function getMediaFile(identifier) {
  if (!identifier) return null;
  await ensureMediaTable();

  const cleanId = String(identifier).trim();
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, filename, mimetype, size, data, created_at
       FROM media_files
       WHERE id = ? OR filename = ?
       LIMIT 1;`,
      cleanId,
      cleanId
    );

    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        ...row,
        data: Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data),
      };
    }
  } catch (err) {
    console.warn('[mediaService] getMediaFile error:', err.message);
  }

  return null;
}

/**
 * Xóa file ảnh khỏi MySQL
 */
async function deleteMediaFile(identifier) {
  if (!identifier) return false;
  await ensureMediaTable();

  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM media_files WHERE id = ? OR filename = ?;`,
      identifier,
      identifier
    );
    return true;
  } catch (err) {
    console.warn('[mediaService] deleteMediaFile error:', err.message);
    return false;
  }
}

module.exports = {
  ensureMediaTable,
  saveMediaFile,
  getMediaFile,
  deleteMediaFile,
};
