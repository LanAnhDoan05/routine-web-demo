const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mediaService = require('../services/mediaService');
const { sendSuccess, sendError } = require('../utils/response');

// Sử dụng memoryStorage để lưu file vào Buffer trong RAM, tương thích 100% với môi trường Serverless / Vercel
const storage = multer.memoryStorage();
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': new Set(['.jpg', '.jpeg']),
  'image/png': new Set(['.png']),
  'image/webp': new Set(['.webp']),
};

function fileFilter(req, file, cb) {
  const allowedExtensions = ALLOWED_IMAGE_TYPES[file.mimetype];
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions || !allowedExtensions.has(extension)) {
    const error = new Error('Chỉ chấp nhận file ảnh JPG, JPEG, PNG hoặc WEBP');
    error.statusCode = 400;
    return cb(error);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter,
});

/**
 * Xử lý sau khi upload thành công: Lưu trực tiếp vào Database MySQL (bảng media_files)
 */
async function handleUploadSuccess(req, res, next) {
  try {
    if (!req.file) {
      return sendError(res, 'Vui lòng chọn file hình ảnh cần tải lên', 400);
    }

    const extensions = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const ext = extensions[req.file.mimetype] || path.extname(req.file.originalname) || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `img-${uniqueSuffix}${ext}`;

    // 1. Lưu file vào Database MySQL
    const saved = await mediaService.saveMediaFile({
      filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    });

    // 2. Lưu phụ bản trên đĩa nếu môi trường local cho phép
    try {
      const uploadDir = path.resolve(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
    } catch (diskErr) {
      // Bỏ qua trên Vercel / Read-Only filesystem
    }

    return sendSuccess(
      res,
      {
        url: saved.url,
        id: saved.id,
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      'Tải hình ảnh lên thành công',
      201
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadSingle: upload.single('image'),
  handleUploadSuccess,
  fileFilter,
  MAX_IMAGE_SIZE_BYTES,
};
