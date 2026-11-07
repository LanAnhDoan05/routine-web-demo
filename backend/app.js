require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
  const requiredSecrets = ['JWT_SECRET', 'VNP_TMN_CODE', 'VNP_HASH_SECRET'];
  const missingSecrets = requiredSecrets.filter((name) => !process.env[name]);
  if (missingSecrets.length > 0) {
    throw new Error(`Missing required production secrets: ${missingSecrets.join(', ')}`);
  }
}

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const apiRouter = require('./src/routes/api');
const errorHandler = require('./src/middlewares/errorHandler');
const { sendError } = require('./src/utils/response');
const { generalLimiter, authLimiter, aiLimiter } = require('./src/middlewares/rateLimiter');

const app = express();

// Bảo vệ HTTP Headers bằng Helmet (cho phép Cross-Origin Resources để Next.js load ảnh tĩnh)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

// Cấu hình CORS để Next.js (http://localhost:3000) có thể gọi API mà không bị chặn
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://*.vercel.app',
];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const hostname = new URL(origin).hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname === 'vercel.app' || hostname.endsWith('.vercel.app')) return true;
  } catch (err) {
    return false;
  }

  return process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép request không có origin (như curl, postman, server-to-server)
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS Policy: Nguồn truy cập không được phép'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-guest-id'],
    exposedHeaders: ['x-session-id'],
  })
);

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.avif')) {
      res.setHeader('Content-Type', 'image/avif');
    }
  }
}));

// Tắt tính năng tự động tạo ETag để tránh phản hồi 304 Not Modified khiến client hiểu lầm là lỗi
app.set('etag', false);

// Middleware chống cache cho API JSON (loại trừ media/ảnh để cho phép HTTP caching)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/media') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Phục vụ ảnh từ Database nếu truy cập trực tiếp /uploads/:id
const mediaController = require('./src/controllers/mediaController');
app.get('/uploads/:id', mediaController.serveMedia);

// Áp dụng Rate Limiter cho các endpoint nhạy cảm và toàn bộ API
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/ai', aiLimiter);
app.use('/api/v1', generalLimiter);

// Gắn toàn bộ API phiên bản 1 vào /api/v1
app.use('/api/v1', apiRouter);

// Bắt các route không tồn tại (404 Not Found)
app.use((req, res, next) => {
  return sendError(res, `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`, 404);
});

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

module.exports = app;
