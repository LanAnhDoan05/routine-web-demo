/** @type {import('next').NextConfig} */
const RAW_BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1')
  .replace(/\/api\/v1\/?$/, '')
  .replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: {
    root: require('path').resolve(__dirname, '..'),
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Chỉ rewrite sang backend ngoài khi RAW_BACKEND là URL tuyệt đối (vd: http://localhost:5001)
    if (RAW_BACKEND && /^https?:\/\//.test(RAW_BACKEND)) {
      return [
        {
          source: '/api/v1/media/:path*',
          destination: `${RAW_BACKEND}/api/v1/media/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
