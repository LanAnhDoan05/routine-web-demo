// Script: Scan source images + DB products, build mapping, then replace images
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SOURCE_ROOT = 'C:\\Ảnh routine';
const BACKEND_UPLOADS = path.resolve(__dirname, '../public/uploads');
const FRONTEND_UPLOADS = path.resolve(__dirname, '../../frontend/public/uploads');

// Step 1: Scan source directory structure
function scanSourceDir(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      result.push(...scanSourceDir(fullPath));
    } else if (item.isFile() && /\.(png|jpg|jpeg|webp|avif|gif)$/i.test(item.name)) {
      // Extract category path info
      const relPath = path.relative(SOURCE_ROOT, fullPath);
      result.push({ fullPath, relPath, name: item.name, size: fs.statSync(fullPath).size });
    }
  }
  return result;
}

// Step 2: Group source images by product folder
function groupByProductFolder(files) {
  const groups = {};
  for (const f of files) {
    const parts = f.relPath.split(path.sep);
    // The product folder is the last directory before the filename
    const productFolder = parts.slice(0, -1).join(path.sep);
    if (!groups[productFolder]) groups[productFolder] = [];
    groups[productFolder].push(f);
  }
  // Sort images in each group by name (to maintain order)
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.name.localeCompare(b.name));
  }
  return groups;
}

async function main() {
  // Scan source images
  console.log('=== SCANNING SOURCE DIRECTORY ===');
  const allFiles = scanSourceDir(SOURCE_ROOT);
  console.log(`Total source image files: ${allFiles.length}`);
  
  const groups = groupByProductFolder(allFiles);
  const folderNames = Object.keys(groups);
  console.log(`Total product folders: ${folderNames.length}`);
  
  // Show folder structure summary
  const categories = {};
  for (const folder of folderNames) {
    const parts = folder.split(path.sep);
    // parts[0] = zip folder name, parts[1] = gender folder, parts[2] = category, parts[3] = product name
    // or parts[0] = zip name, parts[1] = main folder, then subfolders
    const key = parts.slice(0, -1).join(' > ');
    if (!categories[key]) categories[key] = [];
    categories[key].push({ folder: parts[parts.length - 1], count: groups[folder].length });
  }
  
  console.log('\n=== SOURCE FOLDER CATEGORIES ===');
  for (const [cat, items] of Object.entries(categories)) {
    console.log(`\n${cat}:`);
    items.sort((a, b) => a.folder.localeCompare(b.folder, 'vi'));
    for (const item of items) {
      console.log(`  ${item.folder} (${item.count} images)`);
    }
  }

  // Get all products from DB  
  console.log('\n=== DATABASE PRODUCTS ===');
  const products = await prisma.product.findMany({
    select: { id: true, name: true, gender: true, categorySlug: true, categoryId: true, images: true, description: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`Total products in DB: ${products.length}`);
  for (const p of products) {
    const imgCount = Array.isArray(p.images) ? p.images.length : 0;
    console.log(`  [${p.id}] ${p.name} | gender=${p.gender} | cat=${p.categorySlug || p.categoryId} | images=${imgCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
