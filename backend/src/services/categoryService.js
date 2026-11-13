const prisma = require('../config/prisma');
const { processSingleImage } = require('../utils/fileStorage');

function getCategoryImageFallback(slug = '', name = '') {
  const normalized = `${slug} ${name}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const has = (...terms) => terms.some((term) => words.includes(term));
  let asset = null;

  if (has('new', 'arrival', 'arrivals') && (has('new', 'hang') || words.includes('arrivals'))) asset = 'new-arrivals';
  else if (has('men', 'nam')) asset = 'men';
  else if (has('women', 'nu')) asset = 'women';
  else if (has('unisex')) asset = 'unisex';
  else if (has('accessory', 'accessories', 'phu', 'kien')) asset = 'accessories';
  else if (has('outerwear', 'outer', 'jacket', 'coat', 'khoac', 'ni')) asset = 'outerwear';
  else if (has('blazer', 'vest')) asset = 'blazer';
  else if (has('jean', 'jeans', 'denim')) asset = 'jeans';
  else if (has('trouser', 'trousers', 'kaki', 'quan', 'vai', 'tay')) asset = 'trousers';
  else if (has('short', 'shorts')) asset = 'shorts';
  else if (has('sneaker', 'sneakers', 'shoe', 'shoes', 'giay')) asset = 'sneakers';
  else if (has('polo', 'len', 'knit')) asset = 'polo';
  else if (has('tshirt', 'tee')) asset = 'tshirt';
  else if (has('shirt', 'sweater', 'so', 'mi')) asset = 'shirt';
  else if (has('bottom', 'bottoms')) asset = 'bottoms';
  else if (has('top', 'tops', 'ao')) asset = 'tops';

  if (!asset) {
    const assets = ['accessories', 'blazer', 'bottoms', 'jacket', 'jeans', 'men', 'new-arrivals', 'outerwear', 'polo', 'shirt', 'shorts', 'sneakers', 'tops', 'trousers', 'tshirt', 'unisex', 'women'];
    const key = slug || name || 'category';
    const hash = Array.from(key).reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0, 7);
    asset = assets[hash % assets.length];
  }

  return `/images/categories/${asset}.svg`;
}

function normalizeCategoryName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

const DEFAULT_STYLES = [
  { id: 'minimal', slug: 'minimal', name: 'Minimalist', description: 'Phong cách tối giản, tinh tế' },
  { id: 'basic', slug: 'basic', name: 'Basic & Clean', description: 'Trang phục thường nhật cơ bản' },
  { id: 'smart-casual', slug: 'smart-casual', name: 'Smart Casual', description: 'Lịch sự nhưng thoải mái' },
  { id: 'streetstyle', slug: 'streetstyle', name: 'Streetstyle', description: 'Phong cách đường phố năng động' },
  { id: 'vintage', slug: 'vintage', name: 'Vintage', description: 'Cổ điển và hoài niệm' },
  { id: 'sporty-chic', slug: 'sporty-chic', name: 'Sporty Chic', description: 'Năng động, thể thao và thời thượng' },
];

function mapCategory(c) {
  if (!c) return null;
  const id = c.id || c.slug;
  const storedImage = c.image || c.imageUrl;
  const img = storedImage
    ? storedImage.replace(/^\/images\/categories\/([a-z0-9-]+)\.jpg$/i, '/images/categories/$1.svg')
    : getCategoryImageFallback(c.slug || c.id, c.name);
  return {
    ...c,
    id,
    slug: c.slug || id,
    name: c.name || id,
    parentId: c.parentId || null,
    status: c.status || 'ACTIVE',
    image: img,
    imageUrl: img,
  };
}

/**
 * Lấy danh sách danh mục từ MySQL (hỗ trợ lọc theo loại: quick, mega, all)
 */
async function getAllCategories({ type } = {}) {
  let list = [];
  try {
    const dbList = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
    if (dbList && dbList.length > 0) {
      list = dbList.map(mapCategory);
    }
  } catch (err) {
    console.error('[categoryService] Prisma findMany failed:', err.message);
  }

  const standardQuickSlugs = ['new-arrivals', 'men', 'women', 'unisex', 'tops', 'bottoms', 'outerwear', 'accessories'];
  const standardMegaSlugs = ['ao', 'quan', 'vay', 'ao-khoac', 'do-basic', 'do-cong-so', 'do-casual', 'phu-kien'];

  // 1. Quick categories (dành cho Trang chủ - Shop by Category)
  // Bao gồm các danh mục chuẩn có trong DB + tất cả danh mục mới tạo/cập nhật (root hoặc type quick)
  const standardQuick = standardQuickSlugs
    .map((slug) => list.find((c) => c.slug === slug && c.status !== 'INACTIVE'))
    .filter(Boolean);

  const customQuick = list.filter((c) => {
    if (c.status === 'INACTIVE') return false;
    if (standardQuickSlugs.includes(c.slug)) return false;
    if (standardMegaSlugs.includes(c.slug) && c.type !== 'quick') return false;
    // Danh mục được chọn là quick hoặc danh mục gốc (không có parentId)
    return c.type === 'quick' || !c.parentId;
  });

  const quickCategories = [...standardQuick, ...customQuick];

  // 2. Mega menu categories (dành cho Header navigation & Mobile Menu)
  // Bao gồm các danh mục chuẩn + tất cả danh mục người dùng tạo thêm
  const standardMega = standardMegaSlugs
    .map((slug) => list.find((c) => c.slug === slug && c.status !== 'INACTIVE'))
    .filter(Boolean);

  const customMega = list.filter((c) => {
    if (c.status === 'INACTIVE') return false;
    if (standardMegaSlugs.includes(c.slug)) return false;
    if (standardQuickSlugs.includes(c.slug)) return false;
    if (c.slug.startsWith('cat-')) return false; // Ẩn các mã subcategory mẫu nội bộ (cat-blazer, cat-jeans, ...)
    return true; // Tất cả các danh mục mới do người dùng/admin tạo
  });

  const megaMenuCategories = [...standardMega, ...customMega];

  if (type === 'quick') {
    return quickCategories;
  }
  if (type === 'mega') {
    return megaMenuCategories;
  }

  return {
    quickCategories,
    megaMenuCategories,
    categories: list,
  };
}

/**
 * Lấy thông tin chi tiết của danh mục theo slug hoặc id từ MySQL
 */
async function getCategoryBySlug(slugOrId) {
  if (!slugOrId) return null;
  const target = String(slugOrId).trim();
  const targetLower = target.toLowerCase();

  try {
    const dbCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: targetLower },
          { id: target },
        ],
      },
    });
    if (dbCategory) return mapCategory(dbCategory);
  } catch (err) {
    console.error('[categoryService] Prisma findFirst failed:', err.message);
  }

  return null;
}

/**
 * Lấy toàn bộ danh sách phong cách (styles)
 */
async function getAllStyles() {
  return DEFAULT_STYLES;
}

/**
 * Lấy chi tiết phong cách theo slug
 */
async function getStyleBySlug(slug) {
  if (!slug) return null;
  const target = slug.toLowerCase().trim();
  const style = DEFAULT_STYLES.find((s) => s.slug.toLowerCase() === target || s.id === target);
  return style || null;
}

/**
 * Thêm danh mục mới (Admin)
 */
async function createCategory(categoryData) {
  const {
    name,
    slug,
    description = '',
    image,
    imageUrl,
    type = 'standard',
    parentId = null,
  } = categoryData;

  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Tên danh mục không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const generatedSlug = slug
    ? slug.trim().toLowerCase()
    : name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

  const existing = await prisma.category.findUnique({
    where: { slug: generatedSlug },
  });

  if (existing) {
    const error = new Error(`Slug "${generatedSlug}" đã tồn tại trên hệ thống`);
    error.statusCode = 409;
    throw error;
  }

  const categoriesByName = await prisma.category.findMany({
    select: { name: true },
  });
  if (categoriesByName.some((category) => normalizeCategoryName(category.name) === normalizeCategoryName(name))) {
    const error = new Error(`Danh mục "${name.trim()}" đã tồn tại trên hệ thống`);
    error.statusCode = 409;
    throw error;
  }

  const rawImage = image || imageUrl || getCategoryImageFallback(generatedSlug, name);
  const finalImage = await processSingleImage(rawImage, `cat_${generatedSlug}`);

  const newCategory = await prisma.category.create({
    data: {
      slug: generatedSlug,
      name: name.trim(),
      description: description ? description.trim() : null,
      image: finalImage,
      type: type || 'standard',
      parentId: parentId || null,
    },
  });

  return mapCategory(newCategory);
}

/**
 * Cập nhật danh mục (Admin)
 */
async function updateCategory(idOrSlug, updateData) {
  if (!idOrSlug) {
    const error = new Error('Thiếu định danh danh mục cần cập nhật');
    error.statusCode = 400;
    throw error;
  }

  const current = await prisma.category.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug.toLowerCase().trim() },
      ],
    },
  });

  if (!current) {
    const error = new Error(`Không tìm thấy danh mục với mã "${idOrSlug}"`);
    error.statusCode = 404;
    throw error;
  }

  const nextName = updateData.name ? updateData.name.trim() : current.name;
  let nextSlug = current.slug;

  if (normalizeCategoryName(nextName) !== normalizeCategoryName(current.name)) {
    const categoriesByName = await prisma.category.findMany({
      select: { id: true, name: true },
    });
    if (categoriesByName.some((category) => category.id !== current.id && normalizeCategoryName(category.name) === normalizeCategoryName(nextName))) {
      const error = new Error(`Danh mục "${nextName}" đã tồn tại trên hệ thống`);
      error.statusCode = 409;
      throw error;
    }
  }

  if (updateData.slug) {
    nextSlug = updateData.slug.trim().toLowerCase();
  }

  if (nextSlug !== current.slug) {
    const duplicate = await prisma.category.findUnique({
      where: { slug: nextSlug },
    });
    if (duplicate && duplicate.id !== current.id) {
      const error = new Error(`Slug "${nextSlug}" đã bị sử dụng bởi danh mục khác`);
      error.statusCode = 409;
      throw error;
    }
  }

  const rawImage = updateData.image !== undefined ? updateData.image : (updateData.imageUrl !== undefined ? updateData.imageUrl : current.image);
  const finalImage = updateData.image !== undefined || updateData.imageUrl !== undefined
    ? await processSingleImage(rawImage || getCategoryImageFallback(nextSlug, nextName), `cat_${current.id}`)
    : current.image;

  const dataToUpdate = {
    name: nextName,
    slug: nextSlug,
    description: updateData.description !== undefined ? updateData.description.trim() : current.description,
    image: finalImage,
    type: updateData.type !== undefined ? updateData.type : current.type,
    parentId: updateData.parentId !== undefined ? updateData.parentId : current.parentId,
  };

  const updated = await prisma.category.update({
    where: { id: current.id },
    data: dataToUpdate,
  });

  // Đồng bộ categorySlug trên bảng Product nếu slug thay đổi
  if (nextSlug !== current.slug) {
    try {
      await prisma.product.updateMany({
        where: { categoryId: current.id },
        data: { categorySlug: nextSlug },
      });
    } catch (e) {
      console.warn('[categoryService] Sync categorySlug failed:', e.message);
    }
  }

  return mapCategory(updated);
}

/**
 * Xóa danh mục (Admin)
 */
async function deleteCategory(idOrSlug) {
  if (!idOrSlug) {
    const error = new Error('Thiếu định danh danh mục cần xóa');
    error.statusCode = 400;
    throw error;
  }

  const current = await prisma.category.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug.toLowerCase().trim() },
      ],
    },
  });

  if (!current) {
    const error = new Error(`Không tìm thấy danh mục với mã "${idOrSlug}"`);
    error.statusCode = 404;
    throw error;
  }

  const childCount = await prisma.category.count({
    where: { parentId: current.id },
  });
  if (childCount > 0) {
    const error = new Error(
      `Không thể xóa danh mục đang có ${childCount} danh mục con trực thuộc. Vui lòng chuyển hoặc xóa danh mục con trước.`
    );
    error.statusCode = 400;
    throw error;
  }

  const productCount = await prisma.product.count({
    where: {
      OR: [
        { categoryId: current.id },
        { categorySlug: current.slug },
      ],
    },
  });
  if (productCount > 0) {
    const error = new Error(
      `Không thể xóa danh mục đang có ${productCount} sản phẩm trực thuộc. Vui lòng chuyển sản phẩm sang danh mục khác trước.`
    );
    error.statusCode = 400;
    throw error;
  }

  const deleted = await prisma.category.delete({
    where: { id: current.id },
  });

  return {
    success: true,
    message: `Đã xóa danh mục "${deleted.name}" thành công`,
    deletedCategory: mapCategory(deleted),
  };
}

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  getAllStyles,
  getStyleBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
