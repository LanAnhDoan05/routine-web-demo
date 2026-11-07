/**
 * Dịch vụ giữ hàng tồn kho trong database.
 * Reservation không trừ stockQuantity; nó chỉ làm giảm số lượng khả dụng
 * cho các phiên thanh toán khác cho đến khi expiresAt hết hạn.
 */

const prisma = require('../config/prisma');

async function getHeldQuantity(productId, excludeOrderId = null, client = prisma) {
  const reservations = await client.stockReservation.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(excludeOrderId ? { orderId: { not: excludeOrderId } } : {}),
    },
    select: { items: true },
  });

  return reservations.reduce((total, reservation) => {
    const items = Array.isArray(reservation.items) ? reservation.items : [];
    return total + items.reduce((itemTotal, item) => {
      return itemTotal + (item.productId === productId ? Number(item.quantity) || 1 : 0);
    }, 0);
  }, 0);
}

async function reserveStock(orderId, items = [], durationMinutes = 5) {
  if (!orderId || !Array.isArray(items) || items.length === 0) return null;

  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const reservationItems = items.map((item) => ({
    productId: item.productId,
    name: item.name,
    quantity: Number(item.quantity) || 1,
  }));

  const productIds = [...new Set(items.map((it) => it.productId).filter(Boolean))];

  // Thực thi bên trong Transaction với batch queries tối ưu và timeout 15s cho cloud DB
  return await prisma.$transaction(
    async (tx) => {
      // 1. Tải thông tin toàn bộ sản phẩm trong 1 câu truy vấn duy nhất (Batch query)
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stockQuantity: true },
      });
      const stockMap = new Map();
      products.forEach((p) => {
        stockMap.set(p.id, p.stockQuantity !== undefined ? Number(p.stockQuantity) : 100);
      });

      // 2. Lấy danh sách giữ hàng đang còn hiệu lực trong 1 câu truy vấn
      const activeReservations = await tx.stockReservation.findMany({
        where: {
          expiresAt: { gt: new Date() },
        },
        select: { orderId: true, items: true },
      });

      function calcHeld(prodId, excludeId = null) {
        let totalHeld = 0;
        for (const res of activeReservations) {
          if (excludeId && res.orderId === excludeId) continue;
          const resItems = Array.isArray(res.items) ? res.items : [];
          for (const it of resItems) {
            if (it.productId === prodId) {
              totalHeld += Number(it.quantity) || 1;
            }
          }
        }
        return totalHeld;
      }

      // 3. Kiểm tra tồn kho khả dụng cho từng sản phẩm trong bộ nhớ
      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        const currentStock = stockMap.has(item.productId) ? stockMap.get(item.productId) : 100;
        const heldStock = calcHeld(item.productId, orderId);
        const availableStock = Math.max(0, currentStock - heldStock);

        if (availableStock < qty) {
          const error = new Error(
            `Sản phẩm "${item.name || item.productId}" không đủ số lượng (chỉ còn ${availableStock} khả dụng do đang có khách hàng khác giữ chỗ).`
          );
          error.statusCode = 400;
          throw error;
        }
      }

      // 4. Ghi nhận hoặc cập nhật lượt giữ hàng
      await tx.stockReservation.upsert({
        where: { orderId },
        create: { orderId, items: reservationItems, expiresAt },
        update: { items: reservationItems, expiresAt },
      });

      return {
        orderId,
        isHeld: true,
        expiresAt: expiresAt.toISOString(),
        remainingSeconds: Math.round((expiresAt.getTime() - Date.now()) / 1000),
      };
    },
    {
      maxWait: 10000,
      timeout: 15000,
    }
  );
}

async function commitStock(orderId) {
  const reservation = await prisma.stockReservation.findUnique({ where: { orderId } });
  let itemsToDeduct = reservation && Array.isArray(reservation.items) ? reservation.items : null;

  if (!itemsToDeduct) {
    const orderItems = await prisma.orderItem.findMany({ where: { orderId } });
    itemsToDeduct = orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
  }

  for (const item of itemsToDeduct) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { decrement: Number(item.quantity) || 1 } },
    });
  }

  await prisma.stockReservation.deleteMany({ where: { orderId } });
  return true;
}

async function releaseStock(orderId) {
  const result = await prisma.stockReservation.deleteMany({ where: { orderId } });
  return result.count > 0;
}

async function getReservation(orderId) {
  const reservation = await prisma.stockReservation.findUnique({ where: { orderId } });
  if (!reservation || reservation.expiresAt <= new Date()) {
    return { orderId, isHeld: false, expiresAt: null, remainingSeconds: 0 };
  }

  return {
    orderId,
    isHeld: true,
    expiresAt: reservation.expiresAt.toISOString(),
    remainingSeconds: Math.max(0, Math.round((reservation.expiresAt.getTime() - Date.now()) / 1000)),
  };
}

async function cleanupExpiredReservations() {
  const expiredReservations = await prisma.stockReservation.findMany({
    where: { expiresAt: { lte: new Date() } },
    select: { orderId: true },
  });

  for (const { orderId } of expiredReservations) {
    await prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        select: { paymentStatus: true, orderStatus: true, note: true },
      });

      await transaction.stockReservation.deleteMany({ where: { orderId } });

      if (order && order.paymentStatus === 'UNPAID' && order.orderStatus !== 'CANCELLED') {
        const timeoutNote = '[Tự động hủy] Đơn hàng quá hạn thanh toán 5 phút, kho đã giải phóng';
        await transaction.order.update({
          where: { id: orderId },
          data: {
            orderStatus: 'CANCELLED',
            note: order.note ? `${order.note} | ${timeoutNote}` : timeoutNote,
          },
        });
      }
    });
  }
}

const cleanupInterval = setInterval(() => {
  cleanupExpiredReservations().catch((error) => {
    console.error('[stockReservation] Cleanup failed:', error.message);
  });
}, 15000);

if (cleanupInterval.unref) cleanupInterval.unref();

module.exports = {
  getHeldQuantity,
  reserveStock,
  commitStock,
  releaseStock,
  getReservation,
  cleanupExpiredReservations,
};