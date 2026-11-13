const { randomUUID } = require('crypto');
const prisma = require('../config/prisma');
const { processImageArray } = require('../utils/fileStorage');
const stockReservationService = require('./stockReservationService');

const PUBLIC_STATUS = 'ACTIVE';
const PRODUCT_STATUSES = new Set(['ACTIVE', 'DRAFT', 'INACTIVE']);
const GENDERS = new Set(['men', 'women', 'unisex']);

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapVariant(variant) {
  return {
    id: variant.id,
    sku: variant.sku,
    colorId: variant.color,
    colorName: variant.color,
    sizeId: variant.size,
    sizeName: variant.size,
    price: Number(variant.price),
    stockQuantity: Number(variant.stockQuantity),
    status: variant.status === 'INACTIVE'
      ? 'INACTIVE'
      : (Number(variant.stockQuantity) > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'),
  };
}

function mapPrismaProduct(product, heldQuantity = 0) {
  if (!product) return null;
  const styles = parseJsonArray(product.styles);
  const images = parseJsonArray(product.images)
    .map((image) => typeof image === 'string' ? image : image?.url)
    .filter(Boolean);
  const sizes = parseJsonArray(product.sizes);
  const colors = parseJsonArray(product.colors);
  const variants = Array.isArray(product.variants) ? product.variants.map(mapVariant) : [];
  const stockQuantity = Number(product.stockQuantity || 0);
  const categorySlug = product.categorySlug || product.category?.slug || product.categoryId || '';

  return {
    ...product,
    id: product.id,
    slug: product.slug || product.id,
    name: product.name,
    shortDescription: product.shortDescription || '',
    price: Number(product.price),
    originalPrice: product.originalPrice == null ? null : Number(product.originalPrice),
    category: categorySlug,
    categoryId: product.categoryId || categorySlug,
    categorySlug,
    gender: product.gender || 'unisex',
    styles,
    style: styles,
    styleIds: styles,
    images,
    sizes,
    colors,
    variants,
    badge: product.badge || null,
    status: product.status || PUBLIC_STATUS,
    isFeatured: Boolean(product.isFeatured),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.reviewCount || 0),
    soldCount: Number(product.soldCount || 0),
    stockQuantity,
    heldQuantity,
    availableStock: Math.max(0, stockQuantity - heldQuantity),
    material: product.materials || '',
    materials: product.materials || '',
    care: product.care || '',
    careInstructions: product.care || '',
    description: product.description || '',
  };
}

async function getAllSourceProducts({ includeNonPublic = false } = {}) {
  const records = await prisma.product.findMany({
    where: includeNonPublic ? undefined : { status: PUBLIC_STATUS },
    include: { category: true, variants: true },
    orderBy: { createdAt: 'desc' },
  });
  const heldQuantities = await stockReservationService.getHeldQuantities(records.map((record) => record.id));
  return records.map((record) => mapPrismaProduct(record, heldQuantities.get(record.id) || 0));
}

async function getProducts({
  category,
  gender,
  style,
  badge,
  minPrice,
  maxPrice,
  q,
  sort,
  page = 1,
  limit = 20,
  includeNonPublic = false,
  status,
} = {}) {
  let list = await getAllSourceProducts({ includeNonPublic });
  if (q && typeof q === 'string' && q.trim()) {
    const keyword = q.trim().toLowerCase();
    list = list.filter((product) => (
      product.name?.toLowerCase().includes(keyword) ||
      product.description?.toLowerCase().includes(keyword) ||
      product.variants.some((variant) => variant.sku?.toLowerCase().includes(keyword))
    ));
  }
  if (category) {
    const normalized = String(category).toLowerCase().trim();
    list = list.filter((product) => {
      if (normalized === 'new-arrivals') return product.badge === 'NEW';
      return [product.category, product.categoryId, product.categorySlug, product.gender]
        .some((value) => String(value || '').toLowerCase() === normalized);
    });
  }
  if (gender) list = list.filter((product) => product.gender.toLowerCase() === String(gender).toLowerCase());
  if (style) list = list.filter((product) => product.styles.some((item) => String(item).toLowerCase() === String(style).toLowerCase()));
  if (badge) list = list.filter((product) => String(product.badge || '').toUpperCase() === String(badge).toUpperCase());
  if (includeNonPublic && status && status !== 'ALL') {
    list = list.filter((product) => product.status === status);
  }
  if (minPrice !== undefined && minPrice !== '' && Number.isFinite(Number(minPrice))) {
    list = list.filter((product) => product.price >= Number(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== '' && Number.isFinite(Number(maxPrice))) {
    list = list.filter((product) => product.price <= Number(maxPrice));
  }

  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'rating' || sort === 'recommended') list.sort((a, b) => b.rating - a.rating);

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(1000, Math.max(1, parseInt(limit, 10) || 20));
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const items = list.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return {
    items,
    pagination: {
      total,
      page: currentPage,
      limit: pageSize,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    },
  };
}

async function getProductById(id, { includeNonPublic = false } = {}) {
  if (!id) return null;
  const record = await prisma.product.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      ...(includeNonPublic ? {} : { status: PUBLIC_STATUS }),
    },
    include: { category: true, variants: true },
  });
  if (!record) return null;
  const heldQuantities = await stockReservationService.getHeldQuantities([record.id]);
  return mapPrismaProduct(record, heldQuantities.get(record.id) || 0);
}

async function getAdminProductById(id) {
  return getProductById(id, { includeNonPublic: true });
}

async function getFeaturedProducts(limit = 8) {
  const count = Math.min(100, Math.max(1, parseInt(limit, 10) || 8));
  const products = await getAllSourceProducts();
  return products.filter((product) => product.isFeatured || product.badge === 'BEST SELLER').slice(0, count);
}

async function getTrendingProducts(genderOrLimit = 8, maybeLimit = 8) {
  const gender = typeof genderOrLimit === 'string' && Number.isNaN(Number(genderOrLimit))
    ? genderOrLimit.toLowerCase().trim()
    : null;
  const limit = Math.min(100, Math.max(1, parseInt(gender ? maybeLimit : genderOrLimit, 10) || 8));
  const products = await getAllSourceProducts();
  return products.filter((product) => !gender || product.gender === gender).slice(0, limit);
}

async function getRelatedProducts(id, limit = 4) {
  const current = await getProductById(id);
  if (!current) return [];
  const products = await getAllSourceProducts();
  return products
    .filter((product) => product.id !== current.id && (product.category === current.category || product.gender === current.gender))
    .slice(0, Math.min(20, Math.max(1, parseInt(limit, 10) || 4)));
}

function validateVariants(variants) {
  if (variants === undefined || variants === null || variants === '') return;
  if (!Array.isArray(variants) || !variants.length || variants.some((variant) => (
    !variant.sku || !String(variant.sku).trim() ||
    !(variant.colorName || variant.color || variant.colorId) ||
    !(variant.sizeName || variant.size || variant.sizeId) ||
    !Number.isInteger(Number(variant.price)) || Number(variant.price) <= 0 ||
    !Number.isInteger(Number(variant.stockQuantity)) || Number(variant.stockQuantity) < 0
  ))) {
    throw badRequest('Mỗi biến thể cần SKU, màu, size, giá và tồn kho hợp lệ');
  }
  const skus = variants.map((variant) => String(variant.sku).trim().toLowerCase());
  if (new Set(skus).size !== skus.length) throw badRequest('SKU biến thể không được trùng lặp');
}

async function resolveCategory(category) {
  if (typeof category !== 'string' || !category.trim()) throw badRequest('Danh mục sản phẩm là bắt buộc');
  const normalized = category.trim();
  const record = await prisma.category.findFirst({
    where: { OR: [{ id: normalized }, { slug: normalized.toLowerCase() }] },
    select: { id: true, slug: true },
  });
  if (!record) throw badRequest('Danh mục sản phẩm không tồn tại');
  return record;
}

function normalizeVariants(variants) {
  return variants.map((variant) => ({
    id: `pv-${randomUUID()}`,
    sku: String(variant.sku).trim(),
    color: variant.colorName || variant.color || variant.colorId,
    size: variant.sizeName || variant.size || variant.sizeId,
    price: Number(variant.price),
    stockQuantity: Number(variant.stockQuantity),
    status: variant.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
  }));
}

function validateImages(images) {
  if (!Array.isArray(images) || images.length === 0) {
    throw badRequest('Sản phẩm phải có ít nhất một hình ảnh');
  }
  for (const img of images) {
    if (typeof img !== 'string' || !img.trim()) {
      throw badRequest('Đường dẫn hình ảnh không hợp lệ');
    }
    const trimmed = img.trim();
    const isValid =
      trimmed.startsWith('/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:image/');
    if (!isValid) {
      throw badRequest('Định dạng đường dẫn ảnh không hợp lệ');
    }
  }
}

async function normalizeImages(images, productId) {
  if (!Array.isArray(images) || !images.length) {
    return [];
  }
  return (await processImageArray(images, productId))
    .map((image) => typeof image === 'string' ? image : image.url || '')
    .filter(Boolean);
}

async function createProduct(productData = {}) {
  const {
    name,
    category,
    gender,
    style = [],
    price,
    originalPrice,
    colors = [],
    sizes = [],
    images,
    badge = null,
    description,
    variants,
    status = 'ACTIVE',
  } = productData;

  if (typeof name !== 'string' || !name.trim()) throw badRequest('Tên sản phẩm không được để trống');
  if (typeof description !== 'string' || !description.trim()) throw badRequest('Mô tả sản phẩm không được để trống');
  if (!Number.isInteger(Number(price)) || Number(price) <= 0) throw badRequest('Giá sản phẩm phải là số nguyên dương');
  if (!GENDERS.has(String(gender).toLowerCase())) throw badRequest('Giới tính sản phẩm không hợp lệ');
  if (!PRODUCT_STATUSES.has(status)) throw badRequest('Trạng thái sản phẩm không hợp lệ');
  if (originalPrice !== undefined && originalPrice !== null && originalPrice !== '' && (
    !Number.isInteger(Number(originalPrice)) || Number(originalPrice) < 0
  )) throw badRequest('Giá gốc phải là số nguyên không âm');
  validateImages(images);
  validateVariants(variants);

  const productId = `p-${randomUUID()}`;
  const imageUrls = await normalizeImages(images, productId);
  const categoryRecord = await resolveCategory(category);
  const variantList = Array.isArray(variants) ? variants : [];
  const resolvedColors = colors.length ? colors : [...new Set(variantList.map((variant) => variant.colorName || variant.color || variant.colorId))];
  const resolvedSizes = sizes.length ? sizes : [...new Set(variantList.map((variant) => variant.sizeName || variant.size || variant.sizeId))];
  const normalizedVariants = Array.isArray(variants) ? normalizeVariants(variants) : [];
  const created = await prisma.product.create({
    data: {
      id: productId,
      slug: productData.slug?.trim() || `${slugify(name)}-${productId.slice(-8)}`,
      name: name.trim(),
      description: description.trim(),
      shortDescription: productData.shortDescription || null,
      price: Number(price),
      originalPrice: originalPrice === '' || originalPrice === undefined ? null : (originalPrice === null ? null : Number(originalPrice)),
      gender: String(gender).toLowerCase(),
      categoryId: categoryRecord.id,
      categorySlug: categoryRecord.slug,
      styles: Array.isArray(style) ? style : [style].filter(Boolean),
      badge,
      materials: productData.materials || productData.material || null,
      care: productData.care || productData.careInstructions || null,
      images: imageUrls,
      colors: resolvedColors,
      sizes: resolvedSizes,
      stockQuantity: normalizedVariants.length ? normalizedVariants.reduce((sum, variant) => sum + Number(variant.stockQuantity), 0) : Number(productData.stockQuantity || 0),
      status,
      isFeatured: Boolean(productData.isFeatured),
      rating: 0,
      reviewCount: 0,
      ...(normalizedVariants.length > 0 ? { variants: { create: normalizedVariants } } : {}),
    },
    include: { category: true, variants: true },
  });
  const heldQuantities = await stockReservationService.getHeldQuantities([created.id]);
  return mapPrismaProduct(created, heldQuantities.get(created.id) || 0);
}

async function updateProduct(id, updateData = {}) {
  if (!id) throw badRequest('Thiếu ID sản phẩm cần cập nhật');
  if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) throw badRequest('Dữ liệu sản phẩm cập nhật không hợp lệ');

  const data = {};
  if (updateData.name !== undefined) {
    if (typeof updateData.name !== 'string' || !updateData.name.trim()) throw badRequest('Tên sản phẩm không được để trống');
    data.name = updateData.name.trim();
  }
  if (updateData.slug !== undefined) data.slug = String(updateData.slug).trim();
  if (updateData.description !== undefined) {
    if (typeof updateData.description !== 'string' || !updateData.description.trim()) throw badRequest('Mô tả sản phẩm không được để trống');
    data.description = updateData.description.trim();
  }
  if (updateData.shortDescription !== undefined) data.shortDescription = String(updateData.shortDescription || '');
  if (updateData.price !== undefined) {
    if (!Number.isInteger(Number(updateData.price)) || Number(updateData.price) <= 0) throw badRequest('Giá sản phẩm phải là số nguyên dương');
    data.price = Number(updateData.price);
  }
  if (updateData.originalPrice !== undefined) {
    const value = updateData.originalPrice;
    if (value === null || value === '') data.originalPrice = null;
    else if (!Number.isInteger(Number(value)) || Number(value) < 0) throw badRequest('Giá gốc phải là số nguyên không âm');
    else data.originalPrice = Number(value);
  }
  if (updateData.gender !== undefined) {
    const gender = String(updateData.gender).toLowerCase();
    if (!GENDERS.has(gender)) throw badRequest('Giới tính sản phẩm không hợp lệ');
    data.gender = gender;
  }
  if (updateData.status !== undefined) {
    if (!PRODUCT_STATUSES.has(updateData.status)) throw badRequest('Trạng thái sản phẩm không hợp lệ');
    data.status = updateData.status;
  }
  if (updateData.badge !== undefined) data.badge = updateData.badge || null;
  if (updateData.isFeatured !== undefined) data.isFeatured = Boolean(updateData.isFeatured);
  if (updateData.materials !== undefined || updateData.material !== undefined) data.materials = updateData.materials || updateData.material || null;
  if (updateData.care !== undefined || updateData.careInstructions !== undefined) data.care = updateData.care || updateData.careInstructions || null;
  if (updateData.style !== undefined || updateData.styles !== undefined || updateData.styleIds !== undefined) {
    const styles = updateData.styles ?? updateData.style ?? updateData.styleIds;
    data.styles = Array.isArray(styles) ? styles : [styles].filter(Boolean);
  }

  const category = updateData.categoryId || updateData.category;
  if (category !== undefined) {
    const resolved = await resolveCategory(category);
    data.categoryId = resolved.id;
    data.categorySlug = resolved.slug;
  }
  if (updateData.images !== undefined) {
    validateImages(updateData.images);
    data.images = await normalizeImages(updateData.images, id);
  }
  if (updateData.variants !== undefined) {
    validateVariants(updateData.variants);
    data.variants = { deleteMany: {}, create: normalizeVariants(updateData.variants) };
    data.stockQuantity = updateData.variants.reduce((sum, variant) => sum + Number(variant.stockQuantity), 0);
    data.colors = [...new Set(updateData.variants.map((variant) => variant.colorName || variant.color || variant.colorId))];
    data.sizes = [...new Set(updateData.variants.map((variant) => variant.sizeName || variant.size || variant.sizeId))];
  } else {
    if (updateData.stockQuantity !== undefined) {
      if (!Number.isInteger(Number(updateData.stockQuantity)) || Number(updateData.stockQuantity) < 0) throw badRequest('Tồn kho phải là số nguyên không âm');
      data.stockQuantity = Number(updateData.stockQuantity);
    }
    if (updateData.colors !== undefined) data.colors = updateData.colors;
    if (updateData.sizes !== undefined) data.sizes = updateData.sizes;
  }

  const updated = await prisma.product.update({
    where: { id },
    data,
    include: { category: true, variants: true },
  });
  const heldQuantities = await stockReservationService.getHeldQuantities([updated.id]);
  return mapPrismaProduct(updated, heldQuantities.get(updated.id) || 0);
}

async function deleteProduct(id) {
  if (!id) throw badRequest('Thiếu ID sản phẩm cần ẩn');
  const updated = await prisma.product.update({
    where: { id },
    data: { status: 'INACTIVE' },
    include: { category: true, variants: true },
  });
  const heldQuantities = await stockReservationService.getHeldQuantities([updated.id]);
  return mapPrismaProduct(updated, heldQuantities.get(updated.id) || 0);
}

async function duplicateProduct(id) {
  const source = await getAdminProductById(id);
  if (!source) {
    const error = new Error(`Không tìm thấy sản phẩm với mã "${id}"`);
    error.statusCode = 404;
    throw error;
  }
  return createProduct({
    ...source,
    id: undefined,
    slug: `${source.slug || source.id}-copy-${randomUUID().slice(-8)}`,
    name: `${source.name} (Bản sao)`,
    status: 'DRAFT',
    badge: 'NEW',
    isFeatured: false,
  });
}

async function checkSkuAvailability(sku, excludeProductId = null) {
  if (!sku || typeof sku !== 'string' || !sku.trim()) throw badRequest('Vui lòng cung cấp mã SKU cần kiểm tra');
  const existing = await prisma.productVariant.findFirst({
    where: {
      sku: { equals: sku.trim() },
      ...(excludeProductId ? { productId: { not: excludeProductId } } : {}),
    },
    select: { productId: true },
  });
  return { sku: sku.trim(), isAvailable: !existing, takenByProductId: existing?.productId || null };
}

async function bulkDeleteProducts(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== 'string')) {
    throw badRequest('Vui lòng cung cấp danh sách ID sản phẩm cần ẩn');
  }
  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { status: 'INACTIVE' },
  });
  return { success: true, deletedCount: result.count, deactivatedIds: ids };
}

module.exports = {
  getProducts,
  getProductById,
  getAdminProductById,
  getFeaturedProducts,
  getTrendingProducts,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  checkSkuAvailability,
  bulkDeleteProducts,
};