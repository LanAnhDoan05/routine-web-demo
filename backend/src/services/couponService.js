/**
 * Quản lý kho mã giảm giá (Coupons / Vouchers) kết nối trực tiếp MySQL qua Prisma
 */

const prisma = require('../config/prisma');

/**
 * Định dạng Coupon trả về client
 */
function formatCoupon(coupon) {
  if (!coupon) return null;
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    maxDiscount: coupon.maxDiscount,
    minOrderValue: coupon.minOrderValue,
    description: coupon.description || '',
    isActive: Boolean(coupon.isActive),
    createdAt: coupon.createdAt,
  };
}

/**
 * Lấy toàn bộ mã giảm giá cho Admin (kể cả mã đang tắt)
 */
async function getAllCouponsForAdmin({ status, search } = {}) {
  try {
    const where = {};
    if (status === 'ACTIVE') where.isActive = true;
    if (status === 'INACTIVE') where.isActive = false;

    if (search && search.trim()) {
      const needle = search.trim();
      where.OR = [
        { code: { contains: needle } },
        { description: { contains: needle } },
      ];
    }

    const records = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map(formatCoupon);
  } catch (err) {
    console.error('[couponService] getAllCouponsForAdmin failed:', err.message);
    return [];
  }
}

/**
 * Lấy danh sách các mã giảm giá đang kích hoạt cho Storefront
 */
async function getActiveCoupons() {
  try {
    const records = await prisma.coupon.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(formatCoupon);
  } catch (err) {
    console.error('[couponService] getActiveCoupons failed:', err.message);
    return [];
  }
}

/**
 * Kiểm tra mã giảm giá và tính toán số tiền giảm theo giá trị đơn hàng
 */
async function validateCoupon(code, subtotal = 0) {
  if (!code || typeof code !== 'string') {
    const error = new Error('Vui lòng cung cấp mã giảm giá');
    error.statusCode = 400;
    throw error;
  }

  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
  });

  if (!coupon || !coupon.isActive) {
    const error = new Error(`Mã giảm giá "${normalized}" không hợp lệ hoặc đã hết hiệu lực`);
    error.statusCode = 400;
    throw error;
  }

  const orderValue = Number(subtotal) || 0;

  if (orderValue < coupon.minOrderValue) {
    const error = new Error(
      `Đơn hàng chưa đạt giá trị tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã "${coupon.code}"`
    );
    error.statusCode = 400;
    throw error;
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.min(
      Math.round((orderValue * coupon.value) / 100),
      coupon.maxDiscount || Infinity
    );
  } else if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, orderValue);
  } else if (coupon.type === 'freeship') {
    discount = coupon.value || 30000;
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    discountAmount: discount,
    description: coupon.description,
    coupon: formatCoupon(coupon),
  };
}

/**
 * Tạo mã giảm giá mới (Admin) - Lưu vào MySQL
 */
async function createCoupon(couponData) {
  const { code, type = 'percent', value, minOrderValue = 0, maxDiscount, description, isActive = true } = couponData;

  if (!code || typeof code !== 'string' || !code.trim()) {
    const error = new Error('Mã giảm giá không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const normalized = code.trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (existing) {
    const error = new Error(`Mã giảm giá "${normalized}" đã tồn tại trên hệ thống`);
    error.statusCode = 409;
    throw error;
  }

  if (value === undefined || isNaN(Number(value)) || Number(value) <= 0) {
    const error = new Error('Giá trị giảm phải là số dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  const created = await prisma.coupon.create({
    data: {
      code: normalized,
      type: ['percent', 'fixed', 'freeship'].includes(type) ? type : 'percent',
      value: parseInt(value, 10),
      minOrderValue: parseInt(minOrderValue, 10) || 0,
      maxDiscount: maxDiscount ? parseInt(maxDiscount, 10) : null,
      description: description || `Giảm giá theo mã ${normalized}`,
      isActive: Boolean(isActive),
    },
  });

  return formatCoupon(created);
}

/**
 * Cập nhật mã giảm giá (Admin) - Cập nhật MySQL
 */
async function updateCoupon(code, updateData) {
  const normalized = (code || '').trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code: normalized } });

  if (!existing) {
    const error = new Error(`Không tìm thấy mã giảm giá "${normalized}"`);
    error.statusCode = 404;
    throw error;
  }

  const dataToUpdate = {};
  if (updateData.type !== undefined) {
    dataToUpdate.type = ['percent', 'fixed', 'freeship'].includes(updateData.type)
      ? updateData.type
      : existing.type;
  }
  if (updateData.value !== undefined) {
    dataToUpdate.value = parseInt(updateData.value, 10);
  }
  if (updateData.minOrderValue !== undefined) {
    dataToUpdate.minOrderValue = parseInt(updateData.minOrderValue, 10);
  }
  if (updateData.maxDiscount !== undefined) {
    dataToUpdate.maxDiscount = updateData.maxDiscount ? parseInt(updateData.maxDiscount, 10) : null;
  }
  if (updateData.description !== undefined) {
    dataToUpdate.description = updateData.description;
  }
  if (updateData.isActive !== undefined) {
    dataToUpdate.isActive = Boolean(updateData.isActive);
  }

  const updated = await prisma.coupon.update({
    where: { code: normalized },
    data: dataToUpdate,
  });

  return formatCoupon(updated);
}

/**
 * Xóa mã giảm giá (Admin) - Xóa khỏi MySQL
 */
async function deleteCoupon(code) {
  const normalized = (code || '').trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code: normalized } });

  if (!existing) {
    const error = new Error(`Không tìm thấy mã giảm giá "${normalized}"`);
    error.statusCode = 404;
    throw error;
  }

  await prisma.coupon.delete({ where: { code: normalized } });

  return {
    deleted: true,
    code: normalized,
    message: `Đã xóa mã giảm giá "${normalized}" thành công`,
  };
}

module.exports = {
  getAllCouponsForAdmin,
  getActiveCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
