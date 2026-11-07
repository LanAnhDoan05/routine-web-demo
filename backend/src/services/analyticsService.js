const prisma = require('../config/prisma');

/**
 * Chuẩn hóa tên nền tảng (TikTok, Facebook, Instagram, Organic/Direct)
 */
function normalizePlatform(input) {
  if (!input) return 'DIRECT';
  const str = String(input).toUpperCase().trim();
  if (str.includes('TIKTOK') || str.includes('TIK_TOK')) return 'TIKTOK';
  if (str.includes('FACEBOOK') || str.includes('FB')) return 'FACEBOOK';
  if (str.includes('INSTAGRAM') || str.includes('IG') || str.includes('INSTA')) return 'INSTAGRAM';
  if (str.includes('ZALO')) return 'ZALO';
  if (str.includes('YOUTUBE')) return 'YOUTUBE';
  if (str.includes('GOOGLE')) return 'GOOGLE';
  return 'OTHER';
}

/**
 * Ghi nhận sự kiện lưu lượng truy cập (Click link, Xem sản phẩm, Thêm giỏ, Mua hàng)
 */
async function trackEvent({
  platform,
  campaign = null,
  productId = null,
  guestSessionId = null,
  userId = null,
  action = 'VIEW',
  metadata = null,
  ipAddress = null,
}) {
  const normPlatform = normalizePlatform(platform);
  const normAction = String(action || 'VIEW').toUpperCase();
  const id = `tl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const metaStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;

  try {
    if (prisma.trafficLog) {
      return await prisma.trafficLog.create({
        data: {
          id,
          platform: normPlatform,
          campaign: campaign || null,
          productId: productId || null,
          guestSessionId: guestSessionId || null,
          userId: userId || null,
          action: normAction,
          metadata: metadata || undefined,
          ipAddress: ipAddress || null,
        },
      });
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO traffic_logs (id, platform, campaign, product_id, guest_session_id, user_id, action, metadata, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());`,
      id,
      normPlatform,
      campaign || null,
      productId || null,
      guestSessionId || null,
      userId || null,
      normAction,
      metaStr,
      ipAddress || null
    );

    return {
      id,
      platform: normPlatform,
      campaign,
      productId,
      guestSessionId,
      userId,
      action: normAction,
    };
  } catch (err) {
    console.warn('[analyticsService] trackEvent error:', err.message);
    return null;
  }
}

/**
 * Lấy số liệu thống kê tổng hợp hệ sinh thái (Admin Dashboard)
 */
async function getEcosystemStats() {
  const platforms = ['TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'DIRECT', 'OTHER'];
  const breakdown = {};

  platforms.forEach((p) => {
    breakdown[p] = {
      platform: p,
      clicks: 0,
      guestCount: 0,
      registeredCount: 0,
      ordersCount: 0,
      revenue: 0,
      conversionRate: 0,
    };
  });

  try {
    // 1. Thống kê click & guest theo nền tảng
    const clickStats = await prisma.$queryRawUnsafe(`
      SELECT 
        platform, 
        COUNT(*) as total_clicks,
        COUNT(DISTINCT guest_session_id) as total_guests
      FROM traffic_logs
      GROUP BY platform;
    `);

    if (Array.isArray(clickStats)) {
      clickStats.forEach((row) => {
        const p = normalizePlatform(row.platform);
        if (!breakdown[p]) {
          breakdown[p] = { platform: p, clicks: 0, guestCount: 0, registeredCount: 0, ordersCount: 0, revenue: 0, conversionRate: 0 };
        }
        breakdown[p].clicks = Number(row.total_clicks) || 0;
        breakdown[p].guestCount = Number(row.total_guests) || 0;
      });
    }

    // 2. Thống kê user đăng ký theo nguồn
    const userStats = await prisma.$queryRawUnsafe(`
      SELECT source, COUNT(*) as total_users
      FROM users
      WHERE source IS NOT NULL
      GROUP BY source;
    `);

    if (Array.isArray(userStats)) {
      userStats.forEach((row) => {
        const p = normalizePlatform(row.source);
        if (breakdown[p]) {
          breakdown[p].registeredCount = Number(row.total_users) || 0;
        }
      });
    }

    // 3. Thống kê đơn hàng và doanh thu theo nguồn tiếp thị
    const orderStats = await prisma.$queryRawUnsafe(`
      SELECT 
        attribution_source, 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue
      FROM orders
      WHERE order_status != 'CANCELLED'
      GROUP BY attribution_source;
    `);

    if (Array.isArray(orderStats)) {
      orderStats.forEach((row) => {
        const p = normalizePlatform(row.attribution_source);
        if (breakdown[p]) {
          breakdown[p].ordersCount = Number(row.total_orders) || 0;
          breakdown[p].revenue = Number(row.total_revenue) || 0;
        }
      });
    }

    // 4. Tính toán tỷ lệ chuyển đổi
    Object.keys(breakdown).forEach((k) => {
      const item = breakdown[k];
      if (item.clicks > 0) {
        item.conversionRate = Number(((item.ordersCount / item.clicks) * 100).toFixed(2));
      }
    });

    // 5. Lấy danh sách 15 sự kiện truy cập gần nhất (Real-time feed)
    const recentLogs = await prisma.$queryRawUnsafe(`
      SELECT 
        tl.id, tl.platform, tl.campaign, tl.product_id, tl.guest_session_id, tl.user_id, tl.action, tl.created_at,
        p.name as product_name, p.images as product_images,
        u.full_name as user_name, u.email as user_email
      FROM traffic_logs tl
      LEFT JOIN products p ON tl.product_id = p.id
      LEFT JOIN users u ON tl.user_id = u.id
      ORDER BY tl.created_at DESC
      LIMIT 15;
    `);

    // 6. Top sản phẩm quan tâm theo nền tảng
    const topProductsByPlatform = await prisma.$queryRawUnsafe(`
      SELECT 
        tl.platform, tl.product_id, COUNT(*) as views,
        p.name as product_name, p.price as product_price, p.images as product_images
      FROM traffic_logs tl
      JOIN products p ON tl.product_id = p.id
      WHERE tl.product_id IS NOT NULL
      GROUP BY tl.platform, tl.product_id, p.name, p.price, p.images
      ORDER BY views DESC
      LIMIT 10;
    `);

    const formattedTopProducts = (topProductsByPlatform || []).map((row) => {
      let firstImage = '';
      try {
        const imgs = typeof row.product_images === 'string' ? JSON.parse(row.product_images) : row.product_images;
        firstImage = Array.isArray(imgs) ? imgs[0] : '';
      } catch (e) {}

      return {
        platform: row.platform,
        productId: row.product_id,
        productName: row.product_name,
        price: Number(row.product_price) || 0,
        views: Number(row.views) || 0,
        image: firstImage,
      };
    });

    const totalClicksAll = Object.values(breakdown).reduce((sum, b) => sum + b.clicks, 0);
    const totalRevenueAll = Object.values(breakdown).reduce((sum, b) => sum + b.revenue, 0);
    const totalOrdersAll = Object.values(breakdown).reduce((sum, b) => sum + b.ordersCount, 0);
    const totalGuestsAll = Object.values(breakdown).reduce((sum, b) => sum + b.guestCount, 0);

    return {
      summary: {
        totalClicks: totalClicksAll,
        totalGuests: totalGuestsAll,
        totalOrders: totalOrdersAll,
        totalRevenue: totalRevenueAll,
      },
      breakdown,
      recentLogs: recentLogs || [],
      topProducts: formattedTopProducts,
    };
  } catch (err) {
    console.error('[analyticsService] getEcosystemStats error:', err);
    return {
      summary: { totalClicks: 0, totalGuests: 0, totalOrders: 0, totalRevenue: 0 },
      breakdown,
      recentLogs: [],
      topProducts: [],
    };
  }
}

/**
 * Lấy danh sách khách vãng lai (Guest Sessions) chi tiết
 */
async function getGuestVisitors({ page = 1, limit = 20, platform = 'ALL', search = '' } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Math.min(100, Number(limit) || 20));
  const offset = (p - 1) * l;

  try {
    let whereClause = "WHERE tl.guest_session_id IS NOT NULL";
    const params = [];

    if (platform && platform !== 'ALL') {
      whereClause += " AND tl.platform = ?";
      params.push(normalizePlatform(platform));
    }

    if (search && search.trim()) {
      whereClause += " AND (tl.guest_session_id LIKE ? OR p.name LIKE ?)";
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const rows = await prisma.$queryRawUnsafe(`
      SELECT 
        tl.guest_session_id,
        tl.platform,
        MIN(tl.created_at) as first_seen,
        MAX(tl.created_at) as last_seen,
        COUNT(*) as total_clicks,
        GROUP_CONCAT(DISTINCT tl.product_id) as product_ids,
        c.id as cart_id,
        COUNT(DISTINCT ci.id) as cart_items_count,
        COUNT(DISTINCT o.id) as orders_count
      FROM traffic_logs tl
      LEFT JOIN products p ON tl.product_id = p.id
      LEFT JOIN carts c ON tl.guest_session_id = c.guest_session_id
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      LEFT JOIN orders o ON tl.guest_session_id = o.guest_session_id
      ${whereClause}
      GROUP BY tl.guest_session_id, tl.platform, c.id
      ORDER BY last_seen DESC
      LIMIT ${l} OFFSET ${offset};
    `, ...params);

    // Đếm tổng số session
    const countResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT tl.guest_session_id) as total
      FROM traffic_logs tl
      LEFT JOIN products p ON tl.product_id = p.id
      ${whereClause};
    `, ...params);

    const total = Number(countResult?.[0]?.total || 0);

    // Lấy thông tin chi tiết các sản phẩm đã xem
    const formattedItems = await Promise.all(
      (rows || []).map(async (row) => {
        const prodIdList = (row.product_ids || '').split(',').filter(Boolean);
        let productsViewed = [];

        if (prodIdList.length > 0) {
          try {
            const foundProds = await prisma.product.findMany({
              where: { id: { in: prodIdList } },
              select: { id: true, name: true, price: true, images: true },
            });
            productsViewed = foundProds.map((pr) => {
              let img = '';
              try {
                const arr = typeof pr.images === 'string' ? JSON.parse(pr.images) : pr.images;
                img = Array.isArray(arr) ? arr[0] : '';
              } catch (e) {}
              return { id: pr.id, name: pr.name, price: pr.price, image: img };
            });
          } catch (e) {}
        }

        const ordersCount = Number(row.orders_count) || 0;
        const cartItemsCount = Number(row.cart_items_count) || 0;

        let status = 'BROWSING';
        if (ordersCount > 0) status = 'CONVERTED';
        else if (cartItemsCount > 0) status = 'IN_CART';

        return {
          guestSessionId: row.guest_session_id,
          platform: row.platform,
          firstSeen: row.first_seen,
          lastSeen: row.last_seen,
          totalClicks: Number(row.total_clicks) || 0,
          cartItemsCount,
          ordersCount,
          status,
          productsViewed,
        };
      })
    );

    return {
      items: formattedItems,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    };
  } catch (err) {
    console.error('[analyticsService] getGuestVisitors error:', err);
    return {
      items: [],
      pagination: { page: p, limit: l, total: 0, totalPages: 0 },
    };
  }
}

/**
 * Lấy toàn bộ số liệu thống kê thời gian thực từ Database cho Admin Dashboard
 */
async function getDashboardStats() {
  try {
    const [
      totalProducts,
      activeProducts,
      lowStockProductsCount,
      outOfStockProductsCount,
      totalOrders,
      ordersAggregate,
      paidAggregate,
      statusCounts,
      totalCustomers,
      guestCountRaw,
      reviewAggregate,
      recentOrdersRaw,
      topSellingRaw,
      lowStockList,
      outOfStockList,
      ecosystemData
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { stockQuantity: { gt: 0 } } }),
      prisma.product.count({ where: { stockQuantity: { lte: 15, gt: 0 } } }),
      prisma.product.count({ where: { stockQuantity: 0 } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { orderStatus: { not: 'CANCELLED' } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.order.groupBy({
        by: ['orderStatus'],
        _count: { id: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.$queryRawUnsafe(`SELECT COUNT(DISTINCT guest_session_id) as total_guests FROM traffic_logs;`),
      prisma.review.aggregate({
        _count: { id: true },
        _avg: { rating: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          user: { select: { fullName: true, email: true } },
        },
      }),
      prisma.$queryRawUnsafe(`
        SELECT 
          oi.product_id,
          p.name,
          p.price,
          p.images,
          p.stock_quantity,
          p.category_id,
          c.name as category_name,
          SUM(oi.quantity) as total_sold,
          SUM(oi.subtotal) as total_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE o.order_status != 'CANCELLED'
        GROUP BY oi.product_id, p.name, p.price, p.images, p.stock_quantity, p.category_id, c.name
        ORDER BY total_sold DESC
        LIMIT 5;
      `),
      prisma.product.findMany({
        where: { stockQuantity: { lte: 15, gt: 0 } },
        take: 5,
        orderBy: { stockQuantity: 'asc' },
        include: { category: true },
      }),
      prisma.product.findMany({
        where: { stockQuantity: 0 },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { category: true },
      }),
      getEcosystemStats(),
    ]);

    const totalRevenue = ordersAggregate._sum.total || 0;
    const validOrdersCount = ordersAggregate._count.id || 0;
    const totalGuests = Array.isArray(guestCountRaw) && guestCountRaw[0]?.total_guests ? Number(guestCountRaw[0].total_guests) : 0;
    const averageOrderValue = validOrdersCount > 0 ? Math.round(totalRevenue / validOrdersCount) : 0;

    // Phân loại trạng thái đơn hàng
    const orderStatusMap = {};
    (statusCounts || []).forEach((sc) => {
      orderStatusMap[sc.orderStatus] = sc._count.id;
    });

    // Format danh sách đơn hàng gần đây
    const formattedRecentOrders = recentOrdersRaw.map((o) => {
      let parsedAddress = null;
      try {
        parsedAddress = typeof o.shippingAddress === 'string' ? JSON.parse(o.shippingAddress) : o.shippingAddress;
      } catch (e) {
        parsedAddress = { address: o.shippingAddress };
      }

      return {
        id: o.id,
        customerName: o.receiverName || o.user?.fullName || 'Khách hàng',
        customerEmail: o.user?.email || (parsedAddress && parsedAddress.email) || '—',
        phoneNumber: o.phoneNumber,
        total: o.total,
        orderStatus: o.orderStatus,
        status: (o.orderStatus || 'CONFIRMED').toLowerCase(),
        paymentMethod: (o.paymentMethod || 'COD').toUpperCase(),
        paymentStatus: o.paymentStatus || 'UNPAID',
        createdAt: o.createdAt,
        itemsCount: (o.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0),
        itemsSummary: (o.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', '),
      };
    });

    // Format top sản phẩm bán chạy
    const formattedTopSelling = (topSellingRaw || []).map((row) => {
      let image = '';
      try {
        const imgs = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
        image = Array.isArray(imgs) ? imgs[0] : '';
      } catch (e) {}

      return {
        id: row.product_id,
        name: row.name,
        price: Number(row.price),
        image: image || '/images/products/men-tshirt-1.avif',
        stockQuantity: Number(row.stock_quantity),
        categoryName: row.category_name || 'Thời trang',
        totalSold: Number(row.total_sold),
        totalSales: Number(row.total_sales),
      };
    });

    // Helper format ảnh cho sản phẩm cảnh báo kho
    const formatProductImage = (p) => {
      let img = '';
      try {
        const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        img = Array.isArray(imgs) ? imgs[0] : '';
      } catch (e) {}
      return img || '/images/products/men-tshirt-1.avif';
    };

    const formattedLowStock = (lowStockList || []).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: formatProductImage(p),
      stockQuantity: p.stockQuantity,
      categoryName: p.category?.name || '—',
    }));

    const formattedOutOfStock = (outOfStockList || []).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: formatProductImage(p),
      stockQuantity: p.stockQuantity,
      categoryName: p.category?.name || '—',
    }));

    return {
      kpi: {
        totalRevenue,
        paidRevenue: paidAggregate._sum.total || 0,
        totalOrders,
        validOrders: validOrdersCount,
        averageOrderValue,
        totalProducts,
        activeProducts,
        lowStockProducts: lowStockProductsCount,
        outOfStockProducts: outOfStockProductsCount,
        totalCustomers,
        totalGuests,
        totalReviews: reviewAggregate._count.id || 0,
        averageRating: reviewAggregate._avg.rating ? Number(reviewAggregate._avg.rating.toFixed(1)) : 5.0,
        statusBreakdown: {
          pending: orderStatusMap['PENDING'] || 0,
          confirmed: orderStatusMap['CONFIRMED'] || 0,
          shipping: orderStatusMap['SHIPPING'] || 0,
          delivered: orderStatusMap['DELIVERED'] || 0,
          cancelled: orderStatusMap['CANCELLED'] || 0,
        },
      },
      socialEcosystem: ecosystemData,
      recentOrders: formattedRecentOrders,
      topSellingProducts: formattedTopSelling,
      inventoryAlerts: {
        lowStock: formattedLowStock,
        outOfStock: formattedOutOfStock,
      },
    };
  } catch (err) {
    console.error('[analyticsService] getDashboardStats error:', err);
    throw err;
  }
}

module.exports = {
  normalizePlatform,
  trackEvent,
  getEcosystemStats,
  getGuestVisitors,
  getDashboardStats,
};
