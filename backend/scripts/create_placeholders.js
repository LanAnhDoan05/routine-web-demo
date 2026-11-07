const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#g)"/>
  <rect x="10" y="10" width="380" height="480" rx="8" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 4"/>
  <g transform="translate(200, 220)">
    <circle cx="0" cy="0" r="40" fill="#cbd5e1"/>
    <path d="M-20 -10 L0 -30 L20 -10 L15 25 L-15 25 Z" fill="#94a3b8"/>
    <text x="0" y="65" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#64748b" letter-spacing="2">ROUTINE</text>
    <text x="0" y="90" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94a3b8">Fashion Product</text>
  </g>
</svg>`;

// Minimal valid 1x1 grey JPEG
const minimalJpgBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const jpgBuffer = Buffer.from(minimalJpgBase64, 'base64');

const frontendImgDir = path.resolve('..', 'frontend', 'public', 'images');
const backendImgDir = path.resolve('public', 'images');

[frontendImgDir, backendImgDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'placeholder.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(dir, 'placeholder.jpg'), jpgBuffer);
  console.log(`Wrote placeholder.svg and valid placeholder.jpg to ${dir}`);
});
