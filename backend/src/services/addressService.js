const prisma = require('../config/prisma');

// Bộ nhớ đệm địa chỉ nếu CSDL chưa kết nối (In-Memory fallback): Map<userId, Array<Address>>
const mockAddressStore = new Map();

// Seed 1 địa chỉ mẫu mặc định cho demo
mockAddressStore.set('user-seed-01', [
  {
    id: 'addr_seed_01',
    userId: 'user-seed-01',
    receiverName: 'Nguyễn Văn A',
    phone: '0123456789',
    street: '123 Nguyễn Trãi',
    ward: 'Phường Thanh Xuân Trung',
    district: 'Thanh Xuân',
    city: 'Hà Nội',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
]);

/**
 * Lấy danh sách địa chỉ nhận hàng của người dùng
 */
async function getAddresses(userId) {
  try {
    const list = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return list;
  } catch (err) {
    const list = mockAddressStore.get(userId) || [];
    return [...list].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  }
}

/**
 * Thêm địa chỉ nhận hàng mới
 */
async function createAddress(userId, addressData) {
  const { receiverName, phone, street, ward = '', district = '', city = '', isDefault = false } =
    addressData;

  if (!receiverName || !receiverName.trim()) {
    const error = new Error('Vui lòng cung cấp tên người nhận hàng');
    error.statusCode = 400;
    throw error;
  }

  if (!phone || !phone.trim()) {
    const error = new Error('Vui lòng cung cấp số điện thoại người nhận');
    error.statusCode = 400;
    throw error;
  }

  if (!street || !street.trim()) {
    const error = new Error('Vui lòng cung cấp địa chỉ số nhà, tên đường');
    error.statusCode = 400;
    throw error;
  }

  let existingList = [];
  try {
    existingList = await prisma.address.findMany({ where: { userId } });
  } catch (err) {
    existingList = mockAddressStore.get(userId) || [];
  }

  // Nếu là địa chỉ đầu tiên, luôn đặt làm mặc định
  const shouldBeDefault = existingList.length === 0 ? true : Boolean(isDefault);

  // Nếu địa chỉ mới là mặc định, hủy mặc định của các địa chỉ trước
  if (shouldBeDefault) {
    try {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    } catch (err) {
      existingList.forEach((a) => (a.isDefault = false));
    }
  }

  let newAddress = null;
  try {
    newAddress = await prisma.address.create({
      data: {
        userId,
        receiverName: receiverName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        ward: ward.trim(),
        district: district.trim(),
        city: city.trim(),
        isDefault: shouldBeDefault,
      },
    });
  } catch (err) {
    newAddress = {
      id: `addr_${Date.now()}`,
      userId,
      receiverName: receiverName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      ward: ward.trim(),
      district: district.trim(),
      city: city.trim(),
      isDefault: shouldBeDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!mockAddressStore.has(userId)) {
      mockAddressStore.set(userId, []);
    }
    mockAddressStore.get(userId).push(newAddress);
  }

  return newAddress;
}

/**
 * Cập nhật địa chỉ
 */
async function updateAddress(userId, addressId, addressData) {
  if (!addressId) {
    const error = new Error('Thiếu ID địa chỉ cần cập nhật');
    error.statusCode = 400;
    throw error;
  }

  const { isDefault, ...otherFields } = addressData;

  if (isDefault) {
    try {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    } catch (err) {
      const list = mockAddressStore.get(userId) || [];
      list.forEach((a) => (a.isDefault = false));
    }
  }

  try {
    const updated = await prisma.address.update({
      where: { id: addressId, userId },
      data: {
        ...otherFields,
        ...(isDefault !== undefined ? { isDefault } : {}),
      },
    });
    return updated;
  } catch (err) {
    const list = mockAddressStore.get(userId) || [];
    const index = list.findIndex((a) => a.id === addressId);
    if (index === -1) {
      const error = new Error(`Không tìm thấy địa chỉ với mã "${addressId}"`);
      error.statusCode = 404;
      throw error;
    }
    list[index] = {
      ...list[index],
      ...otherFields,
      ...(isDefault !== undefined ? { isDefault } : {}),
      updatedAt: new Date().toISOString(),
    };
    return list[index];
  }
}

/**
 * Xóa địa chỉ
 */
async function deleteAddress(userId, addressId) {
  if (!addressId) {
    const error = new Error('Thiếu ID địa chỉ cần xóa');
    error.statusCode = 400;
    throw error;
  }

  try {
    const deleted = await prisma.address.delete({
      where: { id: addressId, userId },
    });
    return deleted;
  } catch (err) {
    const list = mockAddressStore.get(userId) || [];
    const index = list.findIndex((a) => a.id === addressId);
    if (index === -1) {
      const error = new Error(`Không tìm thấy địa chỉ với mã "${addressId}"`);
      error.statusCode = 404;
      throw error;
    }
    const deleted = list.splice(index, 1)[0];
    // Nếu vừa xóa địa chỉ mặc định mà còn địa chỉ khác, gán cái đầu tiên làm mặc định
    if (deleted.isDefault && list.length > 0) {
      list[0].isDefault = true;
    }
    return deleted;
  }
}

/**
 * Đặt địa chỉ làm mặc định
 */
async function setDefaultAddress(userId, addressId) {
  return updateAddress(userId, addressId, { isDefault: true });
}

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
