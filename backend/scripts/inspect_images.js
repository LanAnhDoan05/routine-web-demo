require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const FRONTEND_PUBLIC = path.resolve(__dirname, '../../frontend/public');

async function main() {
  // Check the specific categories that have empty images in DB
  const emptyImageCats = ['cat-accessories', 'cat-blazer', 'cat-jacket', 'cat-jeans', 'cat-polo', 'cat-shirt', 'cat-shorts', 'cat-sneakers', 'cat-trousers', 'cat-tshirt'];

  // For each, see what slug maps in frontend
  const slugMappings = {
    'cat-accessories': 'accessories',
    'cat-blazer': 'blazer',
    'cat-jacket': 'jacket',
    'cat-jeans': 'jeans',
    'cat-polo': 'polo',
    'cat-shirt': 'shirt',
    'cat-shorts': 'shorts',
    'cat-sneakers': 'sneakers',
    'cat-trousers': 'trousers',
    'cat-tshirt': 'tshirt',
  };

  console.log('Checking category image fallbacks:');
  for (const [catSlug, imgSlug] of Object.entries(slugMappings)) {
    const svgPath = path.join(FRONTEND_PUBLIC, 'images', 'categories', `${imgSlug}.svg`);
    const jpgPath = path.join(FRONTEND_PUBLIC, 'images', 'categories', `${imgSlug}.jpg`);
    console.log(`- ${catSlug}: fallback /images/categories/${imgSlug}.svg exists = ${fs.existsSync(svgPath)}, .jpg = ${fs.existsSync(jpgPath)}`);
  }

  // Check that /api/v1/media/ images URL format for products work correctly 
  // The frontend uses these relative URLs, and Next.js rewrites /api/v1/media/* to backend
  console.log('\nNext.js rewrites check:');
  const nextConfig = fs.readFileSync(path.resolve(__dirname, '../../frontend/next.config.js'), 'utf-8');
  console.log('next.config.js rewrite for /api/v1/media:', nextConfig.includes('/api/v1/media') ? 'YES' : 'NO');

  // Check if there are products without images
  const productsNoImages = await prisma.product.findMany({
    where: { images: null },
    select: { id: true, name: true }
  });
  console.log('\nProducts with NULL images:', productsNoImages.length);
  if (productsNoImages.length > 0) {
    productsNoImages.forEach(p => console.log(` - [${p.id}] ${p.name}`));
  }

  // Check which categories appear in categories?type=quick API response
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const standardQuickSlugs = ['new-arrivals', 'men', 'women', 'unisex', 'tops', 'bottoms', 'outerwear', 'accessories'];
  console.log('\nQuick categories image check:');
  for (const slug of standardQuickSlugs) {
    const cat = categories.find(c => c.slug === slug);
    const imgPath = path.join(FRONTEND_PUBLIC, 'images', 'categories', `${slug}.svg`);
    const jpgPath = path.join(FRONTEND_PUBLIC, 'images', 'categories', `${slug}.jpg`);
    const hasLocalImg = fs.existsSync(imgPath) || fs.existsSync(jpgPath);
    const dbImage = cat ? cat.image : 'NOT IN DB';
    console.log(`- ${slug}: DB image = "${dbImage}", local fallback exists = ${hasLocalImg}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
