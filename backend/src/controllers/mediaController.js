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

    // 3. Fallback: Ảnh placeholder thanh lịch chuẩn Routine (HTTP 200 OK để trình duyệt render hiển thị mượt mà)
    const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
      <defs>
        <linearGradient id="g_routine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F4F1EA" />
          <stop offset="100%" stop-color="#E2E8F0" />
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#g_routine)"/>
      <rect x="24" y="24" width="752" height="952" fill="none" stroke="#2B2D42" stroke-width="1.5" stroke-opacity="0.15"/>
      <g transform="translate(400, 460) scale(3.5)" opacity="0.85">
        <rect x="-35" y="-35" width="70" height="70" rx="12" fill="#2B2D42" fill-opacity="0.06" stroke="#2B2D42" stroke-width="1.5"/>
        <circle cx="0" cy="-6" r="14" fill="none" stroke="#2B2D42" stroke-width="2.5"/>
        <path d="M-18 20 C-18 8, 18 8, 18 20" fill="none" stroke="#2B2D42" stroke-width="2.5" stroke-linecap="round"/>
      </g>
      <text x="400" y="700" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="600" letter-spacing="3" fill="#2B2D42">ROUTINE ESSENTIALS</text>
      <text x="400" y="735" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" letter-spacing="4" fill="#2B2D42" opacity="0.6">FASHION COLLECTION</text>
      <text x="400" y="930" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" letter-spacing="6" fill="#2B2D42" opacity="0.4">ROUTINE</text>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(placeholderSvg);
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
