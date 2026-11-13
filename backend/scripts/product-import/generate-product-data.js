const fs = require('fs');
const path = require('path');

const outputRoot = path.join(__dirname, 'output');
const pricing = require('./pricing-config.json');
const categoryMap = {
  'ao-khoac': 'ao-khoac',
  'ao-len': 'ao',
  'ao-ni': 'ao',
  'ao-vest': 'outerwear',
  'quan-jean': 'cat-jeans',
  'quan-kaki': 'quan',
  'quan-ni': 'quan',
  'quan-tay': 'quan',
  'quan-vai': 'quan',
  dam: 'vay',
  'giay-dep': 'accessories',
  non: 'accessories',
  'tui-vi': 'accessories',
  'vo-tat': 'accessories',
};

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function capitalize(value) {
  return value ? value[0].toLocaleUpperCase('vi-VN') + value.slice(1) : value;
}

function main() {
  const inspectionPath = path.join(outputRoot, 'database-inspection.json');
  const scanPath = path.join(outputRoot, 'product-import-data.json');
  if (!fs.existsSync(inspectionPath) || !fs.existsSync(scanPath)) {
    throw new Error('Cần chạy inspect-db.js và scan-images.js trước khi tạo dữ liệu nhập');
  }
  const database = JSON.parse(fs.readFileSync(inspectionPath, 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(scanPath, 'utf8'));
  const bySlug = new Map(database.categories.map((category) => [category.slug, category]));
  const products = candidates.map((candidate) => {
    const categorySlug = categoryMap[candidate.categorySlugHint];
    const category = bySlug.get(categorySlug);
    const price = pricing.categoryPrices[candidate.categorySlugHint];
    if (!category || !Number.isInteger(price) || price <= 0) {
      return { ...candidate, categoryId: null, categorySlug, importReady: false, importIssue: 'MISSING_CATEGORY_OR_PRICE' };
    }

    const genderText = candidate.genderHint === 'men' ? 'nam' : candidate.genderHint === 'women' ? 'nữ' : null;
    const productName = capitalize([candidate.categoryLabelHint, genderText, `mẫu ${candidate.productCode.slice(-4)}`]
      .filter(Boolean)
      .join(' '));
    const slug = `${slugify(productName)}-${candidate.productCode.toLowerCase()}`;
    return {
      id: candidate.productCode.toLowerCase(),
      productCode: candidate.productCode,
      sku: candidate.productCode,
      name: productName,
      slug,
      categoryId: category.id,
      categorySlug: category.slug,
      gender: candidate.genderHint || 'unisex',
      shortDescription: `Sản phẩm ${candidate.categoryLabelHint || 'thời trang'}; thông tin chi tiết đang chờ Admin xác nhận.`,
      description: [
        `Nhóm sản phẩm nhận diện từ tên ảnh: ${candidate.categoryLabelHint || 'chưa xác định'}.`,
        'Chất liệu, kích thước, màu sắc và image role chưa được xác minh.',
        `Giá đề xuất ${price.toLocaleString('vi-VN')} VNĐ (nguồn ${pricing.source}); cần Admin xác nhận trước khi kinh doanh.`,
      ].join(' '),
      price,
      originalPrice: null,
      priceSource: pricing.source,
      styles: [],
      materials: null,
      care: null,
      images: candidate.images,
      sizes: [],
      colors: [],
      stockQuantity: 0,
      status: 'DRAFT',
      isFeatured: false,
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
      categorySlugHint: candidate.categorySlugHint,
      imageCount: candidate.imageCount,
      imageRoleStatus: candidate.imageRoleStatus,
      reviewStatus: candidate.reviewStatus,
      importReady: true,
    };
  });

  const notReady = products.filter((product) => !product.importReady);
  if (notReady.length) throw new Error(`Có ${notReady.length} sản phẩm thiếu danh mục hoặc giá; không tạo dữ liệu nhập`);
  const ids = products.map((product) => product.id);
  const slugs = products.map((product) => product.slug);
  if (new Set(ids).size !== ids.length || new Set(slugs).size !== slugs.length) {
    throw new Error('ID hoặc slug bị trùng trong dữ liệu nhập');
  }
  fs.writeFileSync(path.join(outputRoot, 'product-import-data.json'), `${JSON.stringify(products, null, 2)}\n`);
  console.log(JSON.stringify({
    products: products.length,
    categoryIds: products.reduce((counts, product) => {
      counts[product.categorySlug] = (counts[product.categorySlug] || 0) + 1;
      return counts;
    }, {}),
    statuses: { DRAFT: products.length },
    stockQuantity: '0 (không giả định tồn kho)',
    priceSource: pricing.source,
    unresolvedVisualReview: products.filter((product) => product.reviewStatus !== 'VERIFIED').length,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
