import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads');
const RAW_API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').trim().replace(/\/+$/, '');
const API_BASE = RAW_API_BASE.endsWith('/api/v1') ? RAW_API_BASE : `${RAW_API_BASE}/api/v1`;

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
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

async function getBackendMedia(id) {
  try {
    const response = await fetch(`${API_BASE}/media/${encodeURIComponent(id)}`, { cache: 'no-store' });
    const headers = new Headers();
    for (const name of ['content-type', 'content-length', 'cache-control', 'etag']) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('[media route] Backend media request failed:', error);
    return new NextResponse('Không thể tải hình ảnh từ máy chủ lưu trữ.', { status: 502 });
  }
}

export async function GET(request, { params }) {
  const { id } = await params;
  if (!id) {
    return new NextResponse(DEFAULT_SVG, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
    });
  }

  const cleanFilename = path.basename(id);
  const filePath = path.join(UPLOADS_DIR, cleanFilename);

  if (fs.existsSync(filePath)) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(cleanFilename).toLowerCase();
      const contentType = MIME_MAP[ext] || 'image/jpeg';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(fileBuffer.length),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (e) {
      // Fallback below
    }
  }

  return getBackendMedia(cleanFilename);
}
