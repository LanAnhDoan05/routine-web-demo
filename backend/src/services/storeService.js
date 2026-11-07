const prisma = require('../config/prisma');

/**
 * Tạo slug an toàn từ tên cửa hàng tiếng Việt
 */
function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Lấy danh sách cửa hàng kèm bộ lọc
 */
async function getAllStores({ region, city, status, search } = {}) {
  const where = {};

  if (region && region !== 'ALL') {
    where.region = region.toUpperCase();
  }

  if (city && city !== 'ALL') {
    where.city = { contains: city };
  }

  if (status && status !== 'ALL') {
    if (status === 'ACTIVE') where.isActive = true;
    else if (status === 'INACTIVE') where.isActive = false;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { address: { contains: q } },
      { city: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  return prisma.store.findMany({
    where,
    orderBy: [
      { region: 'asc' },
      { isFlagship: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Thống kê tổng quan về hệ thống cửa hàng
 */
async function getStoreStats() {
  const [total, active, flagship, north, central, south, cities] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { isActive: true } }),
    prisma.store.count({ where: { isFlagship: true } }),
    prisma.store.count({ where: { region: 'NORTH' } }),
    prisma.store.count({ where: { region: 'CENTRAL' } }),
    prisma.store.count({ where: { region: 'SOUTH' } }),
    prisma.store.findMany({
      select: { city: true },
      distinct: ['city'],
    }),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    flagship,
    north,
    central,
    south,
    totalCities: cities.length,
    cities: cities.map((c) => c.city).sort(),
  };
}

/**
 * Lấy chi tiết cửa hàng theo ID hoặc slug
 */
async function getStoreByIdOrSlug(idOrSlug) {
  return prisma.store.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
}

/**
 * Thêm mới một cửa hàng (Admin)
 */
async function createStore(data) {
  const name = (data.name || '').trim();
  if (!name) {
    const error = new Error('Tên cửa hàng không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const address = (data.address || '').trim();
  if (!address) {
    const error = new Error('Địa chỉ cửa hàng không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const city = (data.city || 'TP. Hồ Chí Minh').trim();
  const region = (data.region || 'SOUTH').toUpperCase();
  
  let baseSlug = data.slug ? slugify(data.slug) : slugify(name);
  let finalSlug = baseSlug;
  let counter = 1;

  while (await prisma.store.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${counter++}`;
  }

  return prisma.store.create({
    data: {
      name,
      slug: finalSlug,
      address,
      city,
      region,
      phone: data.phone ? String(data.phone).trim() : null,
      openingHours: data.openingHours ? String(data.openingHours).trim() : '09:00 - 22:00',
      mapUrl: data.mapUrl ? String(data.mapUrl).trim() : null,
      image: data.image ? String(data.image).trim() : null,
      isFlagship: Boolean(data.isFlagship),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    },
  });
}

/**
 * Cập nhật thông tin cửa hàng (Admin)
 */
async function updateStore(id, data) {
  const existing = await prisma.store.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Không tìm thấy cửa hàng');
    error.statusCode = 404;
    throw error;
  }

  let finalSlug = existing.slug;
  if (data.slug && data.slug !== existing.slug) {
    finalSlug = slugify(data.slug);
    const conflict = await prisma.store.findFirst({
      where: { slug: finalSlug, id: { not: id } },
    });
    if (conflict) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }
  }

  return prisma.store.update({
    where: { id },
    data: {
      name: data.name !== undefined ? String(data.name).trim() : existing.name,
      slug: finalSlug,
      address: data.address !== undefined ? String(data.address).trim() : existing.address,
      city: data.city !== undefined ? String(data.city).trim() : existing.city,
      region: data.region !== undefined ? String(data.region).toUpperCase() : existing.region,
      phone: data.phone !== undefined ? (data.phone ? String(data.phone).trim() : null) : existing.phone,
      openingHours: data.openingHours !== undefined ? (data.openingHours ? String(data.openingHours).trim() : '09:00 - 22:00') : existing.openingHours,
      mapUrl: data.mapUrl !== undefined ? (data.mapUrl ? String(data.mapUrl).trim() : null) : existing.mapUrl,
      image: data.image !== undefined ? (data.image ? String(data.image).trim() : null) : existing.image,
      isFlagship: data.isFlagship !== undefined ? Boolean(data.isFlagship) : existing.isFlagship,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
    },
  });
}

/**
 * Bật / tắt trạng thái hoạt động của cửa hàng (Admin)
 */
async function toggleStoreStatus(id) {
  const existing = await prisma.store.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Không tìm thấy cửa hàng');
    error.statusCode = 404;
    throw error;
  }

  return prisma.store.update({
    where: { id },
    data: {
      isActive: !existing.isActive,
    },
  });
}

/**
 * Xóa một cửa hàng (Admin)
 */
async function deleteStore(id) {
  const existing = await prisma.store.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Không tìm thấy cửa hàng');
    error.statusCode = 404;
    throw error;
  }

  return prisma.store.delete({ where: { id } });
}

module.exports = {
  getAllStores,
  getStoreStats,
  getStoreByIdOrSlug,
  createStore,
  updateStore,
  toggleStoreStatus,
  deleteStore,
};
