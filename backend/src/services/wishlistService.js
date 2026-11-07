const prisma = require('../config/prisma');

/**
 * Phân tách identityId thành { userId } hoặc { guestSessionId }
 */
function parseIdentity(identityId) {
  if (!identityId) {
    return { guestSessionId: 'anonymous' };
  }
  const idStr = String(identityId).trim();
  if (idStr.startsWith('guest_')) {
    return { guestSessionId: idStr.replace(/^guest_/, '') || 'anonymous' };
  }
  return { userId: idStr };
}

/**
 * Lấy hoặc khởi tạo Wishlist trong MySQL
 */
async function getOrCreateWishlist(identityId) {
  const { userId, guestSessionId } = parseIdentity(identityId);
  const where = userId ? { userId } : { guestSessionId };

  let wishlist = await prisma.wishlist.findUnique({
    where,
    include: {
      items: {
        include: {
          product: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: userId ? { userId } : { guestSessionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  return wishlist;
}

/**
 * Lấy danh sách sản phẩm yêu thích kèm thông tin chi tiết đầy đủ từ MySQL
 */
async function getWishlist(identityId) {
  const wishlist = await getOrCreateWishlist(identityId);

  const items = (wishlist.items || [])
    .filter((item) => item.product)
    .map((item) => {
      const p = item.product;
      let images = [];
      if (Array.isArray(p.images)) {
        images = p.images;
      } else if (typeof p.images === 'string') {
        try {
          images = JSON.parse(p.images || '[]');
        } catch {
          images = [p.images];
        }
      }

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        category: p.categorySlug || p.categoryId,
        images: images.length > 0 ? images : ['/images/placeholder.jpg'],
        badge: p.badge,
        addedAt: item.createdAt,
      };
    });

  const productIds = items.map((i) => i.id);

  return {
    items,
    productIds,
    count: items.length,
  };
}

/**
 * Thêm sản phẩm vào danh sách yêu thích trong MySQL
 */
async function addItem(identityId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const error = new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
    error.statusCode = 404;
    throw error;
  }

  const wishlist = await getOrCreateWishlist(identityId);

  await prisma.wishlistItem.upsert({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
    update: {},
    create: {
      wishlistId: wishlist.id,
      productId,
    },
  });

  return getWishlist(identityId);
}

/**
 * Xóa sản phẩm khỏi danh sách yêu thích
 */
async function removeItem(identityId, productId) {
  const wishlist = await getOrCreateWishlist(identityId);

  try {
    await prisma.wishlistItem.delete({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });
  } catch {
    // Không tìm thấy để xóa thì bỏ qua
  }

  return getWishlist(identityId);
}

/**
 * Bật/tắt trạng thái yêu thích (Toggle)
 */
async function toggleItem(identityId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const error = new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
    error.statusCode = 404;
    throw error;
  }

  const wishlist = await getOrCreateWishlist(identityId);

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
  });

  let inWishlist = false;
  if (existing) {
    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    });
    inWishlist = false;
  } else {
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      },
    });
    inWishlist = true;
  }

  const updatedWishlist = await getWishlist(identityId);
  return {
    inWishlist,
    productId,
    ...updatedWishlist,
  };
}

/**
 * Kiểm tra xem sản phẩm có trong wishlist không
 */
async function checkInWishlist(identityId, productId) {
  const wishlist = await getOrCreateWishlist(identityId);
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
  });

  return {
    productId,
    inWishlist: !!existing,
  };
}

/**
 * Xóa sạch danh sách yêu thích
 */
async function clearWishlist(identityId) {
  const wishlist = await getOrCreateWishlist(identityId);

  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id },
  });

  return getWishlist(identityId);
}

/**
 * Gộp wishlist từ khách vãng lai sang tài khoản người dùng khi đăng nhập
 */
async function mergeWishlist(guestSessionId, userId) {
  const cleanGuestId = String(guestSessionId || '').replace(/^guest_/, '');
  if (!cleanGuestId) {
    return getWishlist(userId);
  }

  const guestWishlist = await prisma.wishlist.findUnique({
    where: { guestSessionId: cleanGuestId },
    include: { items: true },
  });

  if (!guestWishlist || !guestWishlist.items || guestWishlist.items.length === 0) {
    return getWishlist(userId);
  }

  const userWishlist = await getOrCreateWishlist(userId);

  for (const item of guestWishlist.items) {
    try {
      await prisma.wishlistItem.upsert({
        where: {
          wishlistId_productId: {
            wishlistId: userWishlist.id,
            productId: item.productId,
          },
        },
        update: {},
        create: {
          wishlistId: userWishlist.id,
          productId: item.productId,
        },
      });
    } catch {
      // ignore
    }
  }

  // Xóa wishlist của khách
  try {
    await prisma.wishlist.delete({
      where: { id: guestWishlist.id },
    });
  } catch {
    // ignore
  }

  return getWishlist(userId);
}

module.exports = {
  getWishlist,
  addItem,
  removeItem,
  toggleItem,
  checkInWishlist,
  clearWishlist,
  mergeWishlist,
};
