const fs = require('fs');
const path = require('path');

const BACKEND_UPLOADS_DIR = path.resolve(__dirname, '../../public/uploads');
const FRONTEND_UPLOADS_DIR = path.resolve(__dirname, '../../../frontend/public/uploads');

// Đảm bảo thư mục lưu trữ tồn tại trên cả backend và frontend
function ensureUploadDirs() {
  if (!fs.existsSync(BACKEND_UPLOADS_DIR)) {
    fs.mkdirSync(BACKEND_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(FRONTEND_UPLOADS_DIR)) {
    try {
      fs.mkdirSync(FRONTEND_UPLOADS_DIR, { recursive: true });
    } catch (e) {
      // non-blocking
    }
  }
}

/**
 * Lưu chuỗi base64 thành file ảnh vật lý trên đĩa
 * Chỉ trả về đường dẫn URL chuỗi ký tự (VD: '/uploads/img_123.jpg')
 * Tuyệt đối không để chuỗi base64 lọt vào database
 */
async function saveBase64ToFile(base64Str, prefix = 'img') {
  if (!base64Str || typeof base64Str !== 'string') return base64Str;

  if (!base64Str.startsWith('data:')) {
    return base64Str;
  }

  const match = base64Str.match(/^data:([a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    const error = new Error('Dữ liệu ảnh không đúng định dạng');
    error.statusCode = 400;
    throw error;
  }

  const mime = match[1].toLowerCase();
  const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext = extensions[mime];
  if (!ext) {
    const error = new Error('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP');
    error.statusCode = 400;
    throw error;
  }

  const cleanPrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'file';
  const filename = `${cleanPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 4 * 1024 * 1024) {
    const error = new Error('Ảnh phải có dữ liệu và không vượt quá 4 MB');
    error.statusCode = 400;
    throw error;
  }

  const mediaService = require('../services/mediaService');
  const saved = await mediaService.saveMediaFile({
    filename,
    mimetype: mime,
    size: buffer.length,
    buffer,
  });
  ensureUploadDirs();

  // Tùy chọn lưu trên đĩa (an toàn trên Vercel với try/catch)
  try {
    fs.writeFileSync(path.join(BACKEND_UPLOADS_DIR, filename), buffer);
    fs.writeFileSync(path.join(FRONTEND_UPLOADS_DIR, filename), buffer);
  } catch (e) {
    // non-blocking trên Vercel / serverless
  }

  return saved.url;
}

/**
 * Xử lý mảng ảnh (cho Product, Review...):
 * Lưu mọi base64 thành file vật lý và trả về mảng chuỗi đường dẫn URL
 */
async function processImageArray(images, prefix = 'prod') {
  if (!Array.isArray(images)) return images;

  return Promise.all(images.map(async (img, index) => {
    if (!img) return null;

    if (typeof img === 'string') {
      return await saveBase64ToFile(img, `${prefix}_${index + 1}`);
    }

    if (typeof img === 'object' && img.url) {
      return {
        ...img,
        url: await saveBase64ToFile(img.url, `${prefix}_${index + 1}`),
      };
    }

    return img;
  })).then((result) => result.filter(Boolean));
}

/**
 * Xử lý 1 ảnh đơn (cho Category, Outfit, User Avatar...):
 * Trả về đường dẫn chuỗi URL sau khi đã lưu file vật lý
 */
async function processSingleImage(image, prefix = 'img') {
  if (!image || typeof image !== 'string') return image;
  return await saveBase64ToFile(image, prefix);
}

/**
 * Đồng bộ file upload giữa backend và frontend
 */
function syncUploadedFile(filename) {
  ensureUploadDirs();
  const src = path.join(BACKEND_UPLOADS_DIR, filename);
  const dest = path.join(FRONTEND_UPLOADS_DIR, filename);
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
    } catch (e) {
      // non-blocking
    }
  }
}

module.exports = {
  saveBase64ToFile,
  processImageArray,
  processSingleImage,
  syncUploadedFile,
  BACKEND_UPLOADS_DIR,
  FRONTEND_UPLOADS_DIR,
};
