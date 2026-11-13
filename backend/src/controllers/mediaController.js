const path = require('path');
const fs = require('fs');
const mediaService = require('../services/mediaService');
const { sendError } = require('../utils/response');

const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../public/uploads');

/**
 * Phục vụ file ảnh trực tiếp từ File hệ thống hoặc Database MySQL (hỗ trợ caching cao cấp)
 */
async function serveMedia(req, res, next) {
  try {
    const rawIdentifier = req.params.id || req.params.filename;
    if (!rawIdentifier) {
      return res.status(404).send('Không tìm thấy hình ảnh');
    }

    const identifier = path.basename(rawIdentifier);

    // 1. ƯU TIÊN CAO NHẤT: Kiểm tra file vật lý trên đĩa cứng (nguyên bản, chất lượng cao nhất)
    const localFile = path.join(LOCAL_UPLOADS_DIR, identifier);
    if (fs.existsSync(localFile)) {
      return res.sendFile(localFile, {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Kiểm tra thêm trong thư mục frontend/public/uploads
    const frontendLocalFile = path.resolve(__dirname, '../../../frontend/public/uploads', identifier);
    if (fs.existsSync(frontendLocalFile)) {
      return res.sendFile(frontendLocalFile, {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Kiểm tra trong cơ sở dữ liệu MySQL (media_files)
    const media = await mediaService.getMediaFile(identifier);
    if (media) {
      // 2.1 Nếu media record có tên file tương ứng trên đĩa cứng, ưu tiên đọc từ đĩa
      if (media.filename && media.filename !== identifier) {
        const namedFile = path.join(LOCAL_UPLOADS_DIR, path.basename(media.filename));
        if (fs.existsSync(namedFile)) {
          return res.sendFile(namedFile, {
            headers: {
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      }

      // 2.2 Đọc từ buffer trong Database
      if (media.data) {
        const buf = Buffer.isBuffer(media.data) ? media.data : Buffer.from(media.data);
        const hexHeader = buf.slice(0, 30).toString('hex').toLowerCase();
        const isCorrupted = hexHeader.includes('efbfbd');

        if (!isCorrupted && buf.length > 0) {
          const etag = `W/"media-${media.id}-${buf.length}"`;
          if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
          }

          res.setHeader('Content-Type', media.mimetype || 'image/jpeg');
          res.setHeader('Content-Length', buf.length);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.setHeader('ETag', etag);

          return res.end(buf);
        }
      }
    }

    return sendError(res, 'Không tìm thấy hình ảnh', 404);
  } catch (err) {
    next(err);
  }
}

/**
 * Xóa media file
 */
async function deleteMedia(req, res, next) {
  try {
    const { id } = req.params;
    const success = await mediaService.deleteMediaFile(id);
    return res.json({ success, message: success ? 'Đã xóa file ảnh' : 'Không tìm thấy file ảnh cần xóa' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  serveMedia,
  deleteMedia,
};
