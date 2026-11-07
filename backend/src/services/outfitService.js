const prisma = require('../config/prisma');
const { processSingleImage, processImageArray } = require('../utils/fileStorage');

function formatOutfit(o) {
  if (!o) return null;
  const productList = (o.products || [])
    .map((op) => {
      const p = op.product || op;
      if (!p || !p.id) return null;
      const images = Array.isArray(p.images)
        ? p.images
        : typeof p.images === 'string'
        ? JSON.parse(p.images || '[]')
        : [];
      const sizes = Array.isArray(p.sizes)
        ? p.sizes
        : typeof p.sizes === 'string'
        ? JSON.parse(p.sizes || '[]')
        : [];
      const colors = Array.isArray(p.colors)
        ? p.colors
        : typeof p.colors === 'string'
        ? JSON.parse(p.colors || '[]')
        : [];
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        gender: p.gender,
        categoryId: p.categoryId,
        categorySlug: p.categorySlug || p.categoryId,
        category: p.categorySlug || p.categoryId,
        images: images.length > 0 ? images : ['/images/placeholder.jpg'],
        sizes,
        colors,
        stockQuantity: p.stockQuantity ?? 100,
        rating: p.rating ?? 5.0,
      };
    })
    .filter(Boolean);

  const total = productList.reduce((sum, p) => sum + (p.price || 0), 0);
  const productIds = (o.products || []).map((op) => op.productId || op.id).filter(Boolean);

  let rawImages = [];
  if (Array.isArray(o.images)) {
    rawImages = o.images;
  } else if (typeof o.images === 'string') {
    try {
      rawImages = JSON.parse(o.images || '[]');
    } catch {
      rawImages = [o.images];
    }
  } else if (o.image) {
    rawImages = [o.image];
  }
  const outfitImages = rawImages.length > 0 ? rawImages : [o.image || '/images/placeholder.jpg'];
  const coverImg = o.image || outfitImages[0] || '/images/placeholder.jpg';

  return {
    id: o.id,
    slug: o.slug || o.id,
    name: o.title || o.name || 'Bộ phối đồ Routine',
    title: o.title || o.name || 'Bộ phối đồ Routine',
    description: o.description || '',
    image: coverImg,
    coverImage: coverImg,
    images: outfitImages,
    occasion: o.occasion,
    style: o.style,
    styleId: o.style,
    gender: o.gender || 'unisex',
    season: o.season,
    featured: Boolean(o.featured),
    status: o.status || 'ACTIVE',
    products: productList,
    productIds: productIds.length > 0 ? productIds : productList.map((p) => p.id),
    total,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

async function attachImagesToOutfits(records) {
  if (!records || records.length === 0) return records;
  const ids = records.map((r) => r.id).filter(Boolean);
  if (ids.length === 0) return records;
  try {
    const placeholders = ids.map(() => '?').join(',');
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, images FROM outfits WHERE id IN (${placeholders})`,
      ...ids
    );
    const map = new Map();
    for (const row of rows) {
      map.set(row.id, row.images);
    }
    for (const r of records) {
      if (map.has(r.id)) {
        r.images = map.get(r.id);
      }
    }
  } catch (err) {
    console.warn('[outfitService] attachImagesToOutfits note:', err.message);
  }
  return records;
}

async function getOutfits({ occasion, style, page = 1, limit = 10 } = {}) {
  const where = {};
  if (occasion) {
    where.occasion = { equals: occasion.trim().toLowerCase() };
  }
  if (style) {
    where.style = { equals: style.trim().toLowerCase() };
  }

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (currentPage - 1) * pageSize;

  const [total, records] = await Promise.all([
    prisma.outfit.count({ where }),
    prisma.outfit.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        products: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  await attachImagesToOutfits(records);
  const totalPages = Math.ceil(total / pageSize);
  const items = records.map(formatOutfit);

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

async function getFeaturedOutfits(limit = 4) {
  const count = parseInt(limit, 10) || 4;
  const records = await prisma.outfit.findMany({
    where: { featured: true },
    take: count,
    include: {
      products: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (records.length === 0) {
    const fallback = await prisma.outfit.findMany({
      take: count,
      include: {
        products: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    await attachImagesToOutfits(fallback);
    return fallback.map(formatOutfit);
  }

  await attachImagesToOutfits(records);
  return records.map(formatOutfit);
}

async function getOutfitById(id) {
  if (!id) return null;
  const record = await prisma.outfit.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      products: {
        include: { product: true },
      },
    },
  });

  if (!record) return null;
  await attachImagesToOutfits([record]);
  return formatOutfit(record);
}

async function getRelatedOutfits(id, limit = 3) {
  const current = await getOutfitById(id);
  if (!current) return [];

  const count = parseInt(limit, 10) || 3;
  const records = await prisma.outfit.findMany({
    where: {
      id: { not: current.id },
      OR: [{ style: current.style }, { occasion: current.occasion }],
    },
    take: count,
    include: {
      products: {
        include: { product: true },
      },
    },
  });

  await attachImagesToOutfits(records);
  return records.map(formatOutfit);
}

async function createOutfit(outfitData) {
  const {
    name,
    title,
    style = 'minimal',
    occasion = 'everyday',
    gender = 'unisex',
    image = '/images/outfits/outfit-01.jpg',
    productIds = [],
    description = '',
    featured = false,
  } = outfitData;

  const outfitName = (name || title || '').trim();
  if (!outfitName) {
    const error = new Error('Tên outfit không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(productIds) || productIds.length === 0) {
    const error = new Error('Vui lòng chọn ít nhất một sản phẩm (productIds) cho outfit');
    error.statusCode = 400;
    throw error;
  }

  // Tạo ID dạng o011, o012...
  const all = await prisma.outfit.findMany({ select: { id: true } });
  const numbers = all
    .map((o) => {
      const match = o.id.match(/^o(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(Boolean);
  const nextNum = (numbers.length > 0 ? Math.max(...numbers) : 10) + 1;
  const newId = `o${String(nextNum).padStart(3, '0')}`;

  // Xử lý nhiều ảnh và ảnh đại diện (cover image)
  let finalCoverImage = '';
  let finalImages = [];
  const rawImages = outfitData.images || outfitData.image || outfitData.coverImage || image;
  if (rawImages) {
    const list = Array.isArray(rawImages) ? rawImages : [rawImages];
    const processed = processImageArray(list, `outfit_${newId}`);
    finalImages = processed.map((img) => (typeof img === 'string' ? img : img.url || '')).filter(Boolean);
    const primaryObj = processed.find((img) => img && typeof img === 'object' && img.isPrimary);
    finalCoverImage = primaryObj ? (primaryObj.url || primaryObj) : (finalImages[0] || '/images/placeholder.jpg');
  } else {
    finalCoverImage = '/images/placeholder.jpg';
    finalImages = [finalCoverImage];
  }

  const selectedStyle = (outfitData.style || outfitData.styleId || style).toLowerCase().trim();

  const created = await prisma.outfit.create({
    data: {
      id: newId,
      slug: newId,
      title: outfitName,
      style: selectedStyle,
      occasion: occasion.toLowerCase().trim(),
      gender: gender.toLowerCase().trim(),
      image: finalCoverImage,
      images: finalImages,
      description: description || '',
      featured: Boolean(featured),
      products: {
        create: productIds.map((pid) => ({
          product: { connect: { id: pid } },
        })),
      },
    },
    include: {
      products: {
        include: { product: true },
      },
    },
  });

  if (finalImages && finalImages.length > 0) {
    try {
      await prisma.$executeRawUnsafe(
        'UPDATE outfits SET images = ? WHERE id = ?;',
        JSON.stringify(finalImages),
        newId
      );
    } catch (err) {
      console.warn('[outfitService] Failed to save raw images in createOutfit:', err.message);
    }
  }
  created.images = finalImages;

  return formatOutfit(created);
}

async function updateOutfit(id, updateData) {
  if (!id) {
    const error = new Error('Thiếu ID outfit cần cập nhật');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.outfit.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });
  if (!existing) {
    const error = new Error(`Không tìm thấy outfit với mã "${id}"`);
    error.statusCode = 404;
    throw error;
  }

  const data = {};
  if (updateData.name || updateData.title) data.title = (updateData.name || updateData.title).trim();
  if (updateData.style || updateData.styleId) data.style = (updateData.style || updateData.styleId).toLowerCase().trim();
  if (updateData.occasion) data.occasion = updateData.occasion.toLowerCase().trim();
  if (updateData.gender) data.gender = updateData.gender.toLowerCase().trim();
  if (updateData.description !== undefined) data.description = updateData.description;
  if (updateData.featured !== undefined) data.featured = Boolean(updateData.featured);
  // Do not set data.status: Outfit model in DB doesn't have status column

  let finalImagesToSave = null;
  const rawImages = updateData.images !== undefined ? updateData.images : (updateData.image !== undefined ? updateData.image : updateData.coverImage);
  if (rawImages !== undefined) {
    const list = Array.isArray(rawImages) ? rawImages : [rawImages];
    const processed = processImageArray(list, `outfit_${existing.id}`);
    const finalImages = processed.map((img) => (typeof img === 'string' ? img : img.url || '')).filter(Boolean);
    const primaryObj = processed.find((img) => img && typeof img === 'object' && img.isPrimary);
    const finalCoverImage = primaryObj
      ? (primaryObj.url || primaryObj)
      : (finalImages[0] || existing.image);
    data.image = finalCoverImage;
    data.images = finalImages;
    finalImagesToSave = finalImages.length > 0 ? finalImages : [finalCoverImage];
  }

  if (Array.isArray(updateData.productIds)) {
    await prisma.outfitProduct.deleteMany({ where: { outfitId: existing.id } });
    data.products = {
      create: updateData.productIds.map((pid) => ({
        product: { connect: { id: pid } },
      })),
    };
  }

  const updated = await prisma.outfit.update({
    where: { id: existing.id },
    data,
    include: {
      products: {
        include: { product: true },
      },
    },
  });

  if (finalImagesToSave !== null) {
    try {
      await prisma.$executeRawUnsafe(
        'UPDATE outfits SET images = ? WHERE id = ?;',
        JSON.stringify(finalImagesToSave),
        existing.id
      );
    } catch (err) {
      console.warn('[outfitService] Failed to update raw images:', err.message);
    }
    updated.images = finalImagesToSave;
  } else {
    await attachImagesToOutfits([updated]);
  }

  return formatOutfit(updated);
}

async function deleteOutfit(id) {
  if (!id) {
    const error = new Error('Thiếu ID outfit cần xóa');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.outfit.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      products: {
        include: { product: true },
      },
    },
  });
  if (!existing) {
    const error = new Error(`Không tìm thấy outfit với mã "${id}"`);
    error.statusCode = 404;
    throw error;
  }

  await prisma.outfit.delete({ where: { id: existing.id } });
  return formatOutfit(existing);
}

module.exports = {
  getOutfits,
  getFeaturedOutfits,
  getOutfitById,
  getRelatedOutfits,
  hydrateOutfit: formatOutfit,
  createOutfit,
  updateOutfit,
  deleteOutfit,
};
