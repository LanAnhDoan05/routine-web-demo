const prisma = require('../src/config/prisma');
const fs = require('fs');
const path = require('path');

async function check() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true }
  });
  console.log(`Total products in DB: ${products.length}`);

  const allImages = new Set();
  const sampleProducts = [];

  products.forEach((p, index) => {
    let imgs = p.images;
    if (typeof imgs === 'string') {
      try { imgs = JSON.parse(imgs); } catch (e) { imgs = [imgs]; }
    }
    if (!Array.isArray(imgs)) imgs = [imgs];
    if (index < 10) {
      sampleProducts.push({ id: p.id, name: p.name, images: imgs });
    }
    imgs.forEach(img => {
      if (img) allImages.add(img);
    });
  });

  console.log('\nSample 10 products:');
  console.log(JSON.stringify(sampleProducts, null, 2));

  console.log(`\nTotal unique image URLs across products: ${allImages.size}`);

  // Kiểm tra từng dạng URL
  let uploadUrls = 0;
  let mediaApiUrls = 0;
  let staticImagesUrls = 0;
  let otherUrls = 0;

  for (const url of allImages) {
    if (typeof url !== 'string') {
      otherUrls++;
      continue;
    }
    if (url.startsWith('/uploads/')) uploadUrls++;
    else if (url.startsWith('/api/v1/media/')) mediaApiUrls++;
    else if (url.startsWith('/images/')) staticImagesUrls++;
    else otherUrls++;
  }

  console.log(`Breakdown of image URLs:`);
  console.log(`  /uploads/: ${uploadUrls}`);
  console.log(`  /api/v1/media/: ${mediaApiUrls}`);
  console.log(`  /images/: ${staticImagesUrls}`);
  console.log(`  other: ${otherUrls}`);

  const mediaList = await prisma.$queryRawUnsafe('SELECT id, filename, size FROM media_files');
  console.log('Total media_files in DB:', mediaList.length);
  const uploadFiles = new Set(fs.readdirSync(path.resolve(__dirname, '../public/uploads')));
  let matchById = 0;
  let matchByFilename = 0;
  mediaList.forEach(m => {
    if (uploadFiles.has(m.id)) matchById++;
    if (uploadFiles.has(m.filename)) matchByFilename++;
  });
  console.log('Matches by id:', matchById);
  console.log('Matches by filename:', matchByFilename);

  // Sample static /images/ URLs
  const sampleStatics = Array.from(allImages).filter(u => typeof u === 'string' && u.startsWith('/images/')).slice(0, 5);
  console.log('\nTesting sample static URLs:');
  for (const url of sampleStatics) {
    const frontendFile = path.resolve(__dirname, '../../frontend/public', url.replace(/^\//, ''));
    console.log(`- ${url}: frontend file exists: ${fs.existsSync(frontendFile)}`);
  }

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
