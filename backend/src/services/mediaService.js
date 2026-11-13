const prisma = require('../config/prisma');
const path = require('path');

/**
 * Lưu file ảnh trực tiếp vào MySQL (hỗ trợ môi trường Serverless / Vercel không có ổ cứng ghi)
 */
async function saveMediaFile({ filename, mimetype, size, buffer, id = null }) {
  const ext = path.extname(filename || '').toLowerCase() || '.jpg';
  const cleanId = id || `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const fileSize = size || (buffer ? buffer.length : 0);

  if (!buffer || buffer.length === 0) {
    throw new Error('Dữ liệu file trống, không thể lưu vào cơ sở dữ liệu');
  }

  await prisma.mediaFile.upsert({
    where: { id: cleanId },
    create: {
      id: cleanId,
      filename: filename || cleanId,
      mimetype: mimetype || 'image/jpeg',
      size: fileSize,
      data: buffer,
    },
    update: {
      filename: filename || cleanId,
      mimetype: mimetype || 'image/jpeg',
      size: fileSize,
      data: buffer,
    },
  });

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
  const cleanId = String(identifier).trim();
  const record = await prisma.mediaFile.findFirst({
    where: { OR: [{ id: cleanId }, { filename: cleanId }] },
  });
  if (!record) return null;
  return {
    ...record,
    data: Buffer.isBuffer(record.data) ? record.data : Buffer.from(record.data),
  };
}

/**
 * Xóa file ảnh khỏi MySQL
 */
async function deleteMediaFile(identifier) {
  if (!identifier) return false;
  const result = await prisma.mediaFile.deleteMany({
    where: { OR: [{ id: identifier }, { filename: identifier }] },
  });
  return result.count > 0;
}

module.exports = {
  saveMediaFile,
  getMediaFile,
  deleteMediaFile,
};
