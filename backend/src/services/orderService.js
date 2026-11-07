const prisma = require('../config/prisma');
const cartService = require('./cartService');
const stockReservationService = require('./stockReservationService');
const emailService = require('./emailService');
const couponService = require('./couponService');
const shippingService = require('./shippingService');

/**
 * Xây dựng timeline các mốc thời gian giao nhận
 */
function buildOrderTimeline(order) {
  const baseDate = new Date(order.createdAt || Date.now());

  const timeline = [
    {
      status: 'placed',
      title: 'Đã đặt hàng',
      description: 'Đơn hàng đã được tạo thành công trên hệ thống',
      time: order.createdAt,
      completed: true,
    },
    {
      status: 'confirmed',
      title: 'Đã xác nhận',
      description: 'Routine đã duyệt đơn và chuẩn bị hàng',
      time: new Date(baseDate.getTime() + 2 * 3600 * 1000).toISOString(),
      completed: ['confirmed', 'shipping', 'delivered'].includes(order.status),
    },
    {
      status: 'shipping',
      title: 'Đang vận chuyển',
      description: 'Đơn hàng đang trên đường giao đến bạn',
      time: new Date(baseDate.getTime() + 24 * 3600 * 1000).toISOString(),
      completed: ['shipping', 'delivered'].includes(order.status),
    },
    {
      status: 'delivered',
      title: 'Đã giao thành công',
      description: 'Khách hàng đã nhận hàng và hoàn tất',
      time: new Date(baseDate.getTime() + 48 * 3600 * 1000).toISOString(),
      completed: order.status === 'delivered',
    },
  ];

  if (order.status === 'cancelled') {
    return [
      timeline[0],
      {
        status: 'cancelled',
        title: 'Đã hủy đơn',
        description: 'Đơn hàng đã bị hủy theo yêu cầu của quý khách',
        time: order.updatedAt || order.createdAt,
        completed: true,
      },
    ];
  }

  return timeline;
}

async function formatOrder(o) {
  if (!o) return null;
  const items = (o.items || []).map((i) => ({
    id: i.id,
    orderId: i.orderId,
    productId: i.productId,
    name: i.name,
    image: i.image && i.image.trim() !== '' ? i.image : '/images/placeholder.svg',
    size: i.size || '',
    color: i.color || '',
    price: i.price,
    quantity: i.quantity,
    subtotal: i.subtotal,
  }));

  const shippingAddrObj = {
    name: o.receiverName || '',
    phone: o.phoneNumber || '',
    address: o.shippingAddress || '',
  };

  const status = (o.orderStatus || 'CONFIRMED').toLowerCase();

  const formatted = {
    id: o.id,
    userId: o.userId,
    identityId: o.userId || o.guestSessionId,
    guestSessionId: o.guestSessionId,
    receiverName: o.receiverName,
    phoneNumber: o.phoneNumber,
    shippingAddress: shippingAddrObj,
    shippingMethod: o.shippingMethod || 'standard',
    paymentMethod: (o.paymentMethod || 'COD').toLowerCase(),
    paymentStatus: o.paymentStatus || 'UNPAID',
    orderStatus: o.orderStatus || 'CONFIRMED',
    status,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    shipping: o.shippingFee,
    discount: o.discount,
    appliedCoupon: o.appliedCoupon || null,
    total: o.total,
    attributionSource: o.attributionSource || (o.user?.source || 'ORGANIC'),
    note: o.note || '',
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items,
    isMember: !!o.userId && !!o.user,
    user: o.user
      ? {
          id: o.user.id,
          fullName: o.user.fullName,
          email: o.user.email,
          phoneNumber: o.user.phoneNumber,
          avatar: o.user.avatar,
          source: o.user.source || 'ORGANIC',
          role: o.user.role,
          createdAt: o.user.createdAt,
        }
      : null,
    reservation: await stockReservationService.getReservation(o.id),
  };

  return {
    ...formatted,
    timeline: buildOrderTimeline(formatted),
  };
}

function calculateFallbackShipping(method, address, subtotal = 0) {
  const dist = address?.nearestStore?.distanceKm ?? null;
  const store = address?.nearestStore ?? null;
  const options = shippingService.calculateShippingOptions(subtotal, dist, store);
  const isExpress = String(method || '').toLowerCase() === 'express';
  if (isExpress) {
    return options.methods.express.fee;
  }
  return options.methods.standard.fee;
}

/**
 * Tạo đơn hàng mới trong MySQL
 */
async function createOrder(identityId, orderInput) {
  const {
    items,
    shippingAddress,
    shippingMethod = 'standard',
    paymentMethod = 'cod',
    subtotal,
    shipping,
    discount = 0,
    total,
    note,
    appliedCoupon,
    couponCode,
  } = orderInput;

  let orderItems = items;

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    const currentCart = await cartService.getCart(identityId);
    if (!currentCart.items || currentCart.items.length === 0) {
      const error = new Error('Giỏ hàng trống, không thể tạo đơn hàng');
      error.statusCode = 400;
      throw error;
    }
    orderItems = currentCart.items;
  }

  const receiverName = (shippingAddress && (shippingAddress.name || shippingAddress.fullName || shippingAddress.receiverName)) || 'Khách hàng';
  const phoneNumber = (shippingAddress && (shippingAddress.phone || shippingAddress.phoneNumber)) || '0123456789';
  const fullAddress =
    typeof shippingAddress === 'string'
      ? shippingAddress
      : [
          shippingAddress?.address || shippingAddress?.street || '',
          shippingAddress?.ward || '',
          shippingAddress?.district || '',
          shippingAddress?.city || shippingAddress?.province || '',
        ]
          .filter(Boolean)
          .join(', ') || 'Địa chỉ nhận hàng';

  const calculatedSubtotal =
    subtotal !== undefined
      ? Number(subtotal)
      : orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let calculatedShipping = shipping !== undefined ? Number(shipping) : calculateFallbackShipping(shippingMethod, shippingAddress, calculatedSubtotal);
  let calculatedDiscount = discount !== undefined ? Number(discount) : 0;
  let finalCoupon = (appliedCoupon || couponCode || '').trim().toUpperCase() || null;

  // Xác thực mã giảm giá nếu có gửi kèm
  if (finalCoupon) {
    try {
      const couponValidation = await couponService.validateCoupon(finalCoupon, calculatedSubtotal);
      if (couponValidation && couponValidation.valid) {
        finalCoupon = couponValidation.code;
        calculatedDiscount = couponValidation.discountAmount;
        if (couponValidation.type === 'freeship') {
          calculatedShipping = 0;
        }
      }
    } catch (couponErr) {
      console.warn(`[orderService] Mã giảm giá "${finalCoupon}" không hợp lệ:`, couponErr.message);
      finalCoupon = null;
      calculatedDiscount = 0;
    }
  }

  const calculatedTotal =
    total !== undefined && !finalCoupon
      ? Number(total)
      : Math.max(0, calculatedSubtotal + calculatedShipping - calculatedDiscount);

  // Sinh ID dạng ORD-YYYY-XXXX tối ưu không kéo toàn bộ bảng đơn hàng
  const year = new Date().getFullYear();
  let nextNum = 1;
  try {
    const latestOrder = await prisma.order.findFirst({
      where: { id: { startsWith: `ORD-${year}-` } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (latestOrder && latestOrder.id) {
      const match = latestOrder.id.match(/ORD-\d{4}-(\d+)/);
      if (match) {
        nextNum = Number(match[1]) + 1;
      }
    } else {
      const count = await prisma.order.count({
        where: { id: { startsWith: `ORD-${year}-` } },
      });
      nextNum = count + 1;
    }
  } catch (err) {
    nextNum = Date.now() % 10000;
  }
  const newOrderId = `ORD-${year}-${String(nextNum).padStart(4, '0')}`;

  const payMethodMap = {
    cod: 'COD',
    card: 'CARD',
    vnpay: 'VNPAY',
    momo: 'MOMO',
  };
  const finalPayMethod = payMethodMap[(paymentMethod || 'cod').toLowerCase()] || 'COD';

  const cleanUserId = identityId ? identityId.replace(/^user_/, '') : null;
  const isRealUser = cleanUserId && (cleanUserId.startsWith('usr-') || cleanUserId.length === 36);

  let validUserId = null;
  let userAccount = null;
  if (isRealUser) {
    try {
      const userExists = await prisma.user.findUnique({ where: { id: cleanUserId } });
      if (userExists) {
        validUserId = cleanUserId;
        userAccount = userExists;
      }
    } catch (uErr) {
      // fallback
    }
  }

  const initialOrderStatus = finalPayMethod === 'VNPAY' ? 'PENDING' : 'CONFIRMED';
  const providedSource = orderInput.attributionSource || orderInput.source;
  const resolvedSource =
    providedSource && providedSource !== 'ORGANIC'
      ? providedSource
      : userAccount?.source && userAccount.source !== 'ORGANIC'
      ? userAccount.source
      : providedSource || 'ORGANIC';
  const normAttribution = String(resolvedSource).toUpperCase();

  // Tối ưu ảnh sản phẩm: Tìm nạp hàng loạt ảnh thiếu nếu có (tránh N+1 query)
  const missingImgProdIds = orderItems
    .filter((it) => (!it.image || it.image.trim() === '') && it.productId)
    .map((it) => it.productId);

  const fallbackImgMap = new Map();
  if (missingImgProdIds.length > 0) {
    try {
      const prods = await prisma.product.findMany({
        where: { id: { in: [...new Set(missingImgProdIds)] } },
        select: { id: true, images: true },
      });
      prods.forEach((p) => {
        try {
          const pImgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
          if (Array.isArray(pImgs) && pImgs.length > 0 && pImgs[0]) {
            fallbackImgMap.set(p.id, pImgs[0]);
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  const itemsToCreate = orderItems.map((item) => {
    let itemImg = item.image && item.image.trim() !== '' ? item.image : fallbackImgMap.get(item.productId);
    return {
      productId: item.productId,
      name: item.name || 'Sản phẩm',
      image: itemImg && itemImg.trim() !== '' ? itemImg : '/images/placeholder.svg',
      size: item.size || 'M',
      color: item.color || 'Đen',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      subtotal: (Number(item.price) || 0) * (Number(item.quantity) || 1),
    };
  });

  const created = await prisma.order.create({
    data: {
      id: newOrderId,
      userId: validUserId,
      guestSessionId: !validUserId ? identityId : null,
      receiverName,
      phoneNumber,
      shippingAddress: fullAddress,
      shippingMethod,
      paymentMethod: finalPayMethod,
      paymentStatus: 'UNPAID',
      orderStatus: initialOrderStatus,
      subtotal: calculatedSubtotal,
      shippingFee: calculatedShipping,
      discount: calculatedDiscount,
      total: calculatedTotal,
      appliedCoupon: finalCoupon,
      attributionSource: normAttribution,
      note: note || '',
      items: {
        create: itemsToCreate,
      },
    },
    include: { items: true },
  });

  // Tạo order trước để thỏa mãn khóa ngoại của stock_reservations.
  // Nếu không đủ hàng, xóa order vừa tạo để không lưu đơn mồ côi.
  try {
    await stockReservationService.reserveStock(newOrderId, orderItems, 5);
  } catch (reservationError) {
    await prisma.order.delete({ where: { id: newOrderId } }).catch(() => {});
    throw reservationError;
  }

  // Cập nhật số lượng đã bán thực tế vào cơ sở dữ liệu (đối với đơn COD đã xác nhận)
  if (finalPayMethod !== 'VNPAY') {
    for (const it of itemsToCreate) {
      if (it.productId) {
        await prisma.product
          .update({
            where: { id: it.productId },
            data: { soldCount: { increment: it.quantity } },
          })
          .catch((e) => console.warn(`[orderService] Cập nhật soldCount thất bại cho ${it.productId}:`, e.message));
      }
    }
  }

  // Chỉ xóa giỏ hàng nếu đơn là COD
  // Đối với VNPay, giỏ hàng được bảo toàn cho tới khi thanh toán thành công
  if (finalPayMethod !== 'VNPAY') {
    try {
      cartService.clearCart(identityId);
    } catch (err) {
      // Không block nếu clear giỏ lỗi
    }

    // Tự động gửi Email Hóa đơn đơn hàng cho COD
    let customerEmail =
      orderInput.customerEmail ||
      orderInput.email ||
      (orderInput.contact && orderInput.contact.email) ||
      (shippingAddress && shippingAddress.email);

    if (!customerEmail && validUserId) {
      try {
        const u = await prisma.user.findUnique({ where: { id: validUserId }, select: { email: true } });
        if (u) customerEmail = u.email;
      } catch (e) {}
    }

    if (customerEmail) {
      setImmediate(async () => {
        try {
          await emailService.sendOrderInvoiceEmail({
            order: created,
            customerEmail,
            customerName: receiverName,
          });
        } catch (e) {
          console.error('[orderService] Lỗi gửi email hóa đơn COD:', e.message);
        }
      });
    }
  }

  return formatOrder(created);
}

/**
 * Lấy danh sách đơn hàng cho người dùng
 */
async function getOrders({ identityId, status, page = 1, limit = 10 } = {}) {
  const where = {};

  if (identityId) {
    const cleanId = identityId.replace(/^user_/, '');
    where.OR = [
      { userId: cleanId },
      { userId: identityId },
      { guestSessionId: identityId },
      { guestSessionId: cleanId },
      { guestSessionId: `user_${cleanId}` },
    ];
  }

  if (status) {
    where.orderStatus = { equals: status.toUpperCase().trim() };
  }

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (currentPage - 1) * pageSize;

  let [total, records] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const items = await Promise.all(records.map(formatOrder));

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

/**
 * Lấy chi tiết đơn hàng theo ID
 */
async function getOrderById(id) {
  if (!id) return null;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          avatar: true,
          source: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  return order ? formatOrder(order) : null;
}

/**
 * Hủy đơn hàng
 */
async function cancelOrder(id) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    const error = new Error(`Không tìm thấy đơn hàng với mã "${id}"`);
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = order.orderStatus.toLowerCase();
  if (currentStatus === 'shipping' || currentStatus === 'delivered') {
    const error = new Error('Đơn hàng đang giao hoặc đã hoàn tất, không thể tự hủy');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { orderStatus: 'CANCELLED' },
    include: { items: true },
  });

  await stockReservationService.releaseStock(id);

  // Hoàn lại số lượng đã bán nếu đơn hàng trước đó đã được tính vào soldCount
  if (order.items && order.items.length > 0 && order.orderStatus !== 'PENDING') {
    for (const it of order.items) {
      if (it.productId) {
        await prisma.product
          .update({
            where: { id: it.productId },
            data: { soldCount: { decrement: it.quantity } },
          })
          .catch(() => {});
      }
    }
  }

  return formatOrder(updated);
}

/**
 * Mua lại đơn hàng cũ (thêm lại items vào giỏ)
 */
async function reorder(id, identityId) {
  const order = await getOrderById(id);
  if (!order) {
    const error = new Error(`Không tìm thấy đơn hàng với mã "${id}"`);
    error.statusCode = 404;
    throw error;
  }

  if (order.items && order.items.length > 0) {
    await cartService.addBulkItems(
      identityId,
      order.items.map((i) => ({
        productId: i.productId,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        image: i.image,
        name: i.name,
        price: i.price,
      }))
    );
  }

  return await cartService.getCart(identityId);
}

/**
 * Lấy toàn bộ đơn hàng của tất cả khách hàng (Admin)
 */
async function getAllOrdersForAdmin({
  status,
  page = 1,
  limit = 50,
  search,
  source,
  paymentStatus,
  customerType,
} = {}) {
  const where = {};

  if (status && status !== 'ALL') {
    where.orderStatus = status.toUpperCase().trim();
  }

  if (paymentStatus && paymentStatus !== 'ALL') {
    where.paymentStatus = paymentStatus.toUpperCase().trim();
  }

  if (source && source !== 'ALL') {
    where.attributionSource = source.toUpperCase().trim();
  }

  if (customerType === 'MEMBER') {
    where.userId = { not: null };
  } else if (customerType === 'GUEST') {
    where.userId = null;
  }

  if (search && search.trim()) {
    const needle = search.trim();
    where.OR = [
      { id: { contains: needle } },
      { receiverName: { contains: needle } },
      { phoneNumber: { contains: needle } },
      { user: { fullName: { contains: needle } } },
      { user: { email: { contains: needle } } },
    ];
  }

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 50);
  const skip = (currentPage - 1) * pageSize;

  const [total, records] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatar: true,
            source: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const items = await Promise.all(records.map(formatOrder));

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

/**
 * Cập nhật trạng thái đơn hàng và trạng thái thanh toán (Admin)
 */
async function updateOrderStatus(id, newStatus, newPaymentStatus = null) {
  if (!id) {
    const error = new Error('Thiếu mã đơn hàng');
    error.statusCode = 400;
    throw error;
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
  const updateData = {};

  if (newStatus) {
    const targetStatus = newStatus.toUpperCase().trim();
    if (!validStatuses.includes(targetStatus)) {
      const error = new Error(
        `Trạng thái đơn hàng không hợp lệ. Các trạng thái được phép: ${validStatuses.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    updateData.orderStatus = targetStatus;
  }

  if (newPaymentStatus) {
    const validPaymentStatuses = ['UNPAID', 'PAID', 'REFUNDED'];
    const targetPayment = newPaymentStatus.toUpperCase().trim();
    if (validPaymentStatuses.includes(targetPayment)) {
      updateData.paymentStatus = targetPayment;
    }
  }

  if (Object.keys(updateData).length === 0) {
    const error = new Error('Không có thông tin trạng thái cần cập nhật');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: { items: true },
  });

  return formatOrder(updated);
}

function getOrderHoldStatus(id) {
  return stockReservationService.getReservation(id);
}

/**
 * Gửi (hoặc gửi lại) hóa đơn đơn hàng qua Email
 */
async function sendOrderInvoice(orderId, targetEmail = null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });

  if (!order) {
    const error = new Error(`Không tìm thấy đơn hàng với mã "${orderId}"`);
    error.statusCode = 404;
    throw error;
  }

  const recipient = targetEmail || (order.user && order.user.email);
  if (!recipient) {
    const error = new Error('Không tìm thấy địa chỉ email nhận hóa đơn');
    error.statusCode = 400;
    throw error;
  }

  const result = await emailService.sendOrderInvoiceEmail({
    order,
    customerEmail: recipient,
    customerName: order.receiverName || (order.user && order.user.fullName),
  });

  return {
    success: true,
    orderId,
    recipient,
    ...result,
  };
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  reorder,
  buildOrderTimeline,
  getAllOrdersForAdmin,
  updateOrderStatus,
  getOrderHoldStatus,
  sendOrderInvoice,
};
