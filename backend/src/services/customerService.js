const prisma = require('../config/prisma');

// In-memory status store cho user nếu CSDL chưa kết nối (id -> status)
const userStatusStore = new Map();

// Seed danh sách khách hàng mẫu khởi tạo nếu chưa có trong DB
const seedCustomers = [
  {
    id: 'usr-customer-001',
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    phoneNumber: '0123456789',
    role: 'CUSTOMER',
    avatar: '/images/avatars/user-01.jpg',
    stylePreference: 'minimal',
    createdAt: '2026-08-15T08:00:00.000Z',
  },
  {
    id: 'usr-customer-002',
    fullName: 'Trần Thị Bích Ngọc',
    email: 'bichngoc.tran@gmail.com',
    phoneNumber: '0987654321',
    role: 'CUSTOMER',
    avatar: '/images/avatars/user-02.jpg',
    stylePreference: 'smart-casual',
    createdAt: '2026-08-20T10:30:00.000Z',
  },
  {
    id: 'usr-customer-003',
    fullName: 'Lê Hoàng Long',
    email: 'hoanglong.le@gmail.com',
    phoneNumber: '0912345678',
    role: 'CUSTOMER',
    avatar: '/images/avatars/user-03.jpg',
    stylePreference: 'streetstyle',
    createdAt: '2026-08-25T14:15:00.000Z',
  },
  {
    id: 'usr-customer-004',
    fullName: 'Phạm Minh Trang',
    email: 'minhtrang.pham@gmail.com',
    phoneNumber: '0933456789',
    role: 'CUSTOMER',
    avatar: '/images/avatars/user-04.jpg',
    stylePreference: 'vintage',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
];

/**
 * Lấy danh sách khách hàng (Admin)
 */
async function getAllCustomers({ page = 1, limit = 10, search = '', status = 'ALL', source = 'ALL', sortBy = 'createdAt' } = {}) {
  let userList = [];

  try {
    const dbUsers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        orders: {
          select: { id: true, total: true, orderStatus: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    userList = dbUsers;
  } catch (err) {
    userList = [];
  }

  // Format thông tin và bổ sung chỉ số LTV
  let formatted = userList.map((u) => {
    const uOrders = u.orders || [];
    const totalOrders = uOrders.length;
    const completedOrders = uOrders.filter(
      (o) => (o.orderStatus || o.status || '').toLowerCase() !== 'cancelled'
    );
    const totalSpent = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const sortedOrders = [...uOrders].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].createdAt : null;
    const currentStatus = userStatusStore.get(u.id) || u.status || 'ACTIVE';

    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      role: u.role || 'CUSTOMER',
      avatar: u.avatar || null,
      gender: u.gender || 'unisex',
      dateOfBirth: u.dateOfBirth ? (u.dateOfBirth instanceof Date ? u.dateOfBirth.toISOString().split('T')[0] : String(u.dateOfBirth).split('T')[0]) : null,
      date: u.date ? (u.date instanceof Date ? u.date.toISOString().split('T')[0] : String(u.date).split('T')[0]) : null,
      stylePreference: u.stylePreference || 'minimal',
      source: u.source || 'ORGANIC',
      status: currentStatus,
      totalOrders,
      totalSpent,
      lastOrderDate,
      createdAt: u.createdAt,
    };
  });

  // Tìm kiếm theo tên, email, sđt
  if (search && search.trim()) {
    const needle = search.trim().toLowerCase();
    formatted = formatted.filter(
      (c) =>
        (c.fullName && c.fullName.toLowerCase().includes(needle)) ||
        (c.email && c.email.toLowerCase().includes(needle)) ||
        (c.phoneNumber && c.phoneNumber.includes(needle))
    );
  }

  // Lọc theo trạng thái
  if (status && status !== 'ALL') {
    formatted = formatted.filter((c) => c.status === status.toUpperCase());
  }

  // Lọc theo nguồn (TikTok, Facebook, Instagram, Organic...)
  if (source && source !== 'ALL') {
    formatted = formatted.filter((c) => (c.source || 'ORGANIC').toUpperCase() === source.toUpperCase());
  }

  // Sắp xếp
  if (sortBy === 'totalSpent') {
    formatted.sort((a, b) => b.totalSpent - a.totalSpent);
  } else if (sortBy === 'totalOrders') {
    formatted.sort((a, b) => b.totalOrders - a.totalOrders);
  } else {
    formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Phân trang
  const totalItems = formatted.length;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 10);
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const items = formatted.slice(startIndex, startIndex + pageSize);

  return {
    items,
    pagination: {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    },
  };
}

/**
 * Xem chi tiết khách hàng và toàn bộ lịch sử đơn hàng
 */
async function getCustomerById(id) {
  if (!id) {
    const error = new Error('Thiếu ID khách hàng');
    error.statusCode = 400;
    throw error;
  }

  let user = null;
  let addresses = [];
  let userOrders = [];

  try {
    user = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
      },
    });
    if (user) {
      addresses = user.addresses || [];
      userOrders = user.orders || [];
    }
  } catch (err) {
    user = null;
  }

  if (!user) {
    const error = new Error(`Không tìm thấy khách hàng với mã "${id}"`);
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = userStatusStore.get(user.id) || user.status || 'ACTIVE';
  const totalOrders = userOrders.length;
  const completedOrders = userOrders.filter(
    (o) => (o.orderStatus || o.status || '').toLowerCase() !== 'cancelled'
  );
  const totalSpent = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role || 'CUSTOMER',
    avatar: user.avatar || null,
    gender: user.gender || 'unisex',
    dateOfBirth: user.dateOfBirth ? (user.dateOfBirth instanceof Date ? user.dateOfBirth.toISOString().split('T')[0] : String(user.dateOfBirth).split('T')[0]) : null,
    date: user.date ? (user.date instanceof Date ? user.date.toISOString().split('T')[0] : String(user.date).split('T')[0]) : null,
    stylePreference: user.stylePreference || 'minimal',
    status: currentStatus,
    createdAt: user.createdAt,
    statistics: {
      totalOrders,
      completedOrdersCount: completedOrders.length,
      cancelledOrdersCount: totalOrders - completedOrders.length,
      totalSpent,
    },
    addresses,
    orders: userOrders,
  };
}

/**
 * Cập nhật trạng thái khách hàng (Khóa / Mở khóa)
 */
async function updateCustomerStatus(id, status) {
  if (!id) {
    const error = new Error('Thiếu ID khách hàng');
    error.statusCode = 400;
    throw error;
  }

  const validStatuses = ['ACTIVE', 'BLOCKED'];
  const nextStatus = (status || '').toUpperCase();
  if (!validStatuses.includes(nextStatus)) {
    const error = new Error('Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE hoặc BLOCKED');
    error.statusCode = 400;
    throw error;
  }

  userStatusStore.set(id, nextStatus);

  return {
    id,
    status: nextStatus,
    message: `Đã chuyển trạng thái khách hàng sang "${nextStatus}"`,
  };
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
};
