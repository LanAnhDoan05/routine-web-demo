require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../../src/config/prisma');
const { createBackup } = require('./backup-database');
const pricing = require('./pricing-config.json');

const backendRoot = path.resolve(__dirname, '../..');
const projectRoot = path.resolve(backendRoot, '..');
const outputRoot = path.join(__dirname, 'output');
const batchSize = 25;

function readJson(filename) {
  const filePath = path.join(outputRoot, filename);
  if (!fs.existsSync(filePath)) throw new Error(`Thiếu file đầu vào: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateInput(manifest, products) {
  if (manifest.length !== 903) throw new Error(`Yêu cầu 903 ảnh, manifest có ${manifest.length}`);
  const invalidImages = manifest.filter((image) => !image.decoded || !image.sha256 || !image.perceptualHash);
  if (invalidImages.length) throw new Error(`Có ${invalidImages.length} ảnh lỗi hoặc thiếu hash`);
  const missingFiles = manifest.filter((image) => !fs.existsSync(path.resolve(projectRoot, image.path)));
  if (missingFiles.length) throw new Error(`Có ${missingFiles.length} file ảnh không còn tồn tại`);
  const invalidProducts = products.filter((product) => (
    !product.importReady ||
    product.status !== 'DRAFT' ||
    product.stockQuantity !== 0 ||
    !Number.isInteger(product.price) ||
    product.price <= 0 ||
    !Array.isArray(product.images) ||
    product.images.length === 0
  ));
  if (invalidProducts.length) throw new Error(`Có ${invalidProducts.length} sản phẩm không đạt điều kiện an toàn`);
  const allMappedImages = products.reduce((sum, product) => sum + product.images.length, 0);
  if (allMappedImages !== manifest.length) {
    throw new Error(`Mapping có ${allMappedImages} ảnh, không khớp manifest ${manifest.length} ảnh`);
  }
  const ids = products.map((product) => product.id);
  const slugs = products.map((product) => product.slug);
  if (new Set(ids).size !== products.length || new Set(slugs).size !== products.length) {
    throw new Error('Dữ liệu nhập có product ID hoặc slug trùng');
  }
}

function toPrismaData(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    originalPrice: null,
    gender: product.gender,
    categoryId: product.categoryId,
    categorySlug: product.categorySlug,
    styles: [],
    badge: null,
    status: 'DRAFT',
    materials: null,
    care: null,
    rating: 0,
    reviewCount: 0,
    images: product.images,
    sizes: [],
    colors: [],
    stockQuantity: 0,
    isFeatured: false,
    isTrending: false,
    soldCount: 0,
  };
}

async function main() {
  const manifest = readJson('image-manifest.json');
  const products = readJson('product-import-data.json');
  validateInput(manifest, products);

  const categories = await prisma.category.findMany({
    where: { id: { in: [...new Set(products.map((product) => product.categoryId))] } },
    select: { id: true, slug: true },
  });
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  for (const product of products) {
    const category = categoriesById.get(product.categoryId);
    if (!category || category.slug !== product.categorySlug) {
      throw new Error(`Danh mục không còn khớp với sản phẩm ${product.productCode}`);
    }
  }

  const existing = await prisma.product.findMany({
    where: { OR: [{ id: { in: products.map((product) => product.id) } }, { slug: { in: products.map((product) => product.slug) } }] },
    select: { id: true, slug: true },
  });
  const existingById = new Map(existing.map((product) => [product.id, product]));
  const existingBySlug = new Map(existing.map((product) => [product.slug, product]));
  for (const product of products) {
    const sameId = existingById.get(product.id);
    const sameSlug = existingBySlug.get(product.slug);
    if ((sameId && sameId.slug !== product.slug) || (sameSlug && sameSlug.id !== product.id)) {
      throw new Error(`ID/slug đang được sản phẩm khác sử dụng: ${product.productCode}`);
    }
  }

  const pending = products.filter((product) => !existingById.has(product.id));
  console.log(JSON.stringify({
    mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
    candidateProducts: products.length,
    alreadyImported: products.length - pending.length,
    pendingProducts: pending.length,
    images: manifest.length,
    status: 'DRAFT',
    categories: categories.length,
    inventory: '0',
    priceSource: pricing.source,
  }, null, 2));
  if (!process.argv.includes('--apply') || pending.length === 0) return;

  const backupPath = await createBackup();
  const logPath = path.join(outputRoot, 'import-execution.log.jsonl');
  fs.appendFileSync(logPath, `${JSON.stringify({
    event: 'backup-created',
    at: new Date().toISOString(),
    backupPath,
    pendingProducts: pending.length,
  })}\n`);

  for (let offset = 0; offset < pending.length; offset += batchSize) {
    const batch = pending.slice(offset, offset + batchSize);
    try {
      await prisma.$transaction(async (transaction) => {
        if (offset === 0) {
          await transaction.storeSetting.upsert({
            where: { settingKey: 'product_import_pricing_v1' },
            create: {
              settingKey: 'product_import_pricing_v1',
              settingValue: JSON.stringify({
                ...pricing,
                inventoryPolicy: 'STOCK_ZERO_UNTIL_ADMIN_CONFIRMS',
                visibilityPolicy: 'DRAFT_UNTIL_ADMIN_REVIEW',
              }),
              description: 'Giá ESTIMATED cho sản phẩm nhập; cần Admin xác nhận.',
            },
            update: {},
          });
        }
        for (const product of batch) {
          await transaction.product.create({ data: toPrismaData(product) });
        }
      }, { timeout: 30000 });
      fs.appendFileSync(logPath, `${JSON.stringify({
        event: 'batch-imported',
        at: new Date().toISOString(),
        offset,
        count: batch.length,
      })}\n`);
      console.log(`Đã nhập batch ${Math.floor(offset / batchSize) + 1}: ${batch.length} sản phẩm`);
    } catch (error) {
      fs.appendFileSync(logPath, `${JSON.stringify({
        event: 'batch-failed',
        at: new Date().toISOString(),
        offset,
        count: batch.length,
        message: error.message,
      })}\n`);
      throw error;
    }
  }
}

main()
  .catch((error) => {
    console.error('Import thất bại:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
