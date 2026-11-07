const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '../../frontend/public/images/products');
const rootImagesDir = path.resolve(__dirname, '../../frontend/public/images');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Danh sách 28 sản phẩm của Routine
const products = [
  { id: 1, name: "Essential Cotton T-Shirt", color: "#2B2D42", bg: "#F4F1EA", icon: "TSHIRT" },
  { id: 2, name: "Oversized Basic Tee", color: "#6C757D", bg: "#EAE6DF", icon: "TSHIRT" },
  { id: 3, name: "Classic White Shirt", color: "#2B2D42", bg: "#FFFFFF", icon: "SHIRT" },
  { id: 4, name: "Linen Blend Shirt", color: "#797D62", bg: "#F7F5F0", icon: "SHIRT" },
  { id: 5, name: "Straight Fit Jeans", color: "#2B4C7E", bg: "#E8EEF5", icon: "PANTS" },
  { id: 6, name: "Slim Fit Black Jeans", color: "#1A1A1A", bg: "#F0F0F0", icon: "PANTS" },
  { id: 7, name: "Pleated Trousers", color: "#555B6E", bg: "#EFF1F3", icon: "PANTS" },
  { id: 8, name: "Relaxed Fit Chinos", color: "#8D7B68", bg: "#F8F5F1", icon: "PANTS" },
  { id: 9, name: "Tailored Blazer", color: "#1D2D44", bg: "#EAEDF1", icon: "JACKET" },
  { id: 10, name: "Minimalist Trench Coat", color: "#A39B8B", bg: "#F5F3EF", icon: "JACKET" },
  { id: 11, name: "Lightweight Bomber", color: "#3E5C76", bg: "#EAEEF3", icon: "JACKET" },
  { id: 12, name: "Denim Jacket", color: "#274C77", bg: "#EBF1F6", icon: "JACKET" },
  { id: 13, name: "Cashmere Knit Sweater", color: "#5E503F", bg: "#F5F2EB", icon: "SWEATER" },
  { id: 14, name: "Ribbed Crewneck", color: "#4A4E69", bg: "#EEEEF2", icon: "SWEATER" },
  { id: 15, name: "Linen Bermuda Shorts", color: "#9A8C98", bg: "#F4F1F4", icon: "SHORTS" },
  { id: 16, name: "Cotton Tailored Shorts", color: "#333333", bg: "#EFEFEF", icon: "SHORTS" },
  { id: 17, name: "Shirt Dress", color: "#4A5568", bg: "#EDF2F7", icon: "DRESS" },
  { id: 18, name: "Mini Denim Skirt", color: "#2B4C7E", bg: "#E8EEF5", icon: "SKIRT" },
  { id: 19, name: "Canvas Sneakers", color: "#333333", bg: "#FAFAFA", icon: "SHOES" },
  { id: 20, name: "Leather Loafers", color: "#4A3728", bg: "#F5F0EB", icon: "SHOES" },
  { id: 21, name: "Minimalist Tote Bag", color: "#2B2D42", bg: "#EAE8E3", icon: "BAG" },
  { id: 22, name: "Crossbody Bag", color: "#333333", bg: "#ECECEC", icon: "BAG" },
  { id: 23, name: "Cotton Baseball Cap", color: "#222222", bg: "#F3F3F3", icon: "CAP" },
  { id: 24, name: "Wool Scarf", color: "#5C5248", bg: "#F5F1EC", icon: "SCARF" },
  { id: 25, name: "Classic Leather Belt", color: "#3D2B1F", bg: "#F4F0E8", icon: "BELT" },
  { id: 26, name: "High Waist Jeans", color: "#1E3A8A", bg: "#EFF6FF", icon: "PANTS" },
  { id: 27, name: "Silk Blend Blouse", color: "#9D174D", bg: "#FDF2F8", icon: "SHIRT" },
  { id: 28, name: "Track Jacket", color: "#111827", bg: "#F3F4F6", icon: "JACKET" }
];

function generateSvg(item, isSecondary = false) {
  const bg = isSecondary ? "#E5E7EB" : item.bg;
  const color = item.color;
  const subtitle = isSecondary ? "ANGLE VIEW" : "ROUTINE ESSENTIALS";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="g_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#g_${item.id})"/>
  
  <!-- Outer border -->
  <rect x="24" y="24" width="752" height="952" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.15"/>
  
  <!-- Silhouette Icon Box -->
  <g transform="translate(400, 460) scale(3.5)" opacity="0.85">
    <rect x="-35" y="-35" width="70" height="70" rx="12" fill="${color}" fill-opacity="0.06" stroke="${color}" stroke-width="1.5"/>
    <circle cx="0" cy="-6" r="14" fill="none" stroke="${color}" stroke-width="2.5"/>
    <path d="M-18 20 C-18 8, 18 8, 18 20" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  
  <!-- Product Label -->
  <text x="400" y="700" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-size="28" font-weight="600" letter-spacing="3" fill="${color}">
    ${item.name.toUpperCase()}
  </text>
  <text x="400" y="735" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-size="16" letter-spacing="4" fill="${color}" opacity="0.6">
    ${subtitle}
  </text>
  
  <!-- Routine Brand Tag -->
  <text x="400" y="930" text-anchor="middle" font-family="'Outfit', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="6" fill="${color}" opacity="0.4">
    ROUTINE
  </text>
</svg>`;
}

console.log('Generating product image files in:', publicDir);

products.forEach((p) => {
  const num = String(p.id).padStart(2, '0');
  const svgPrimary = generateSvg(p, false);
  const svgSecondary = generateSvg(p, true);

  // 1. Files requested by catalog (/images/products/product-XX.jpg)
  fs.writeFileSync(path.join(publicDir, `product-${num}.jpg`), svgPrimary, 'utf8');
  fs.writeFileSync(path.join(publicDir, `product-${num}.svg`), svgPrimary, 'utf8');
  fs.writeFileSync(path.join(publicDir, `product-${num}-02.jpg`), svgSecondary, 'utf8');

  // 2. Legacy svg files (p0XX-1.svg, p0XX-2.svg)
  fs.writeFileSync(path.join(publicDir, `p${String(p.id).padStart(3, '0')}-1.svg`), svgPrimary, 'utf8');
  fs.writeFileSync(path.join(publicDir, `p${String(p.id).padStart(3, '0')}-2.svg`), svgSecondary, 'utf8');
});

// Create global placeholder.jpg
const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <rect width="800" height="1000" fill="#F4F4F5"/>
  <rect x="20" y="20" width="760" height="960" fill="none" stroke="#D1D5DB" stroke-width="2"/>
  <text x="400" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="600" fill="#9CA3AF">ROUTINE</text>
  <text x="400" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#9CA3AF">IMAGE NOT FOUND</text>
</svg>`;
fs.writeFileSync(path.join(rootImagesDir, 'placeholder.jpg'), placeholderSvg, 'utf8');
fs.writeFileSync(path.join(publicDir, 'placeholder.jpg'), placeholderSvg, 'utf8');

console.log(`[SUCCESS] Generated all product image files for 28 products (both .jpg and .svg formats)`);
