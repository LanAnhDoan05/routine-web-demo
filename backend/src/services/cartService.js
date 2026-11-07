const prisma = require('../config/prisma');
const { products: fallbackProducts } = require('../data/products');
const couponService = require('./couponService');

// Danh sách mã ưu đãi hợp lệ mặc định
const AVAILABLE_COUPONS = {
  ROUTINE10: {
    code: 'ROUTINE10',
    type: 'percent',
    value: 10,
    maxDiscount: 100000,
    minOrderValue: 200000,
    description: 'Giảm 10% tối đa 100k cho đơn từ 200k',
  },
  ROUTINE50K: {
    code: 'ROUTINE50K',
    type: 'fixed',
    value: 50000,
    minOrderValue: 300000,
    description: 'Giảm 50.000đ cho đơn từ 300k',
  },
  FREESHIP: {
    code: 'FREESHIP',
    type: 'freeship',
    value: 30000,
    minOrderValue: 0,
    description: 'Miễn phí vận chuyển toàn quốc',
  },
};

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
  const cleanUser = idStr.replace(/^user_/, '');
  return { userId: cleanUser };
}


/**
 * Tạo Cart Line ID duy nhất dựa trên productId, size và color
 */
function makeLineId(productId, size, color) {
  return `${productId}__${size || 'default'}__${color || 'default'}`;
}

/**
 * Lấy hoặc khởi tạo cấu trúc giỏ hàng trong MySQL
 */
async function getOrCreateCart(identityId) {
  const { userId, guestSessionId } = parseIdentity(identityId);
  const where = userId ? { userId } : { guestSessionId };

  let cart = await prisma.cart.findUnique({
    where,
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { guestSessionId },
      include: {
        items: true,
      },
    });
  }

  return cart;
}

/**
 * Tính toán các chỉ số tài chính của giỏ hàng
 */
async function calculateCartTotals(cart) {
  const items = (cart.items || []).map((item) => ({
    id: item.id,
    lineId: item.lineId,
    productId: item.productId,
    name: item.name,
    category: item.category,
    gender: item.gender,
    price: item.price,
    originalPrice: item.originalPrice || item.price,
    image: item.image || '',
    size: item.size || 'M',
    color: item.color || 'Đen',
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Phí ship: 30,000đ mặc định; miễn phí khi subtotal >= 500,000đ hoặc giỏ trống
  let shippingFee = 0;
  if (subtotal > 0) {
    shippingFee = subtotal >= 500000 ? 0 : 30000;
  }

  // Tính discount theo coupon
  let discount = 0;
  let couponInfo = null;

  if (cart.appliedCoupon && subtotal > 0) {
    let coupon = null;
    try {
      const dbCoupon = await prisma.coupon.findUnique({ where: { code: cart.appliedCoupon } });
      if (dbCoupon && dbCoupon.isActive) {
        coupon = dbCoupon;
      }
    } catch {
      // ignore
    }
    if (!coupon) {
      coupon = AVAILABLE_COUPONS[cart.appliedCoupon] || null;
    }

    if (coupon) {
      if (subtotal >= coupon.minOrderValue) {
        if (coupon.type === 'percent') {
          discount = Math.min(Math.round((subtotal * coupon.value) / 100), coupon.maxDiscount || Infinity);
        } else if (coupon.type === 'fixed') {
          discount = Math.min(coupon.value, subtotal);
        } else if (coupon.type === 'freeship') {
          shippingFee = 0;
          discount = 0;
        }
        couponInfo = {
          code: coupon.code,
          description: coupon.description,
          discountAmount: discount,
        };
      } else {
        // Đơn hàng không còn đủ giá trị tối thiểu: tự động hủy mã
        await prisma.cart.update({
          where: { id: cart.id },
          data: { appliedCoupon: null },
        });
      }
    } else {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { appliedCoupon: null },
      });
    }
  }

  const total = Math.max(0, subtotal - discount + shippingFee);

  return {
    items,
    itemCount,
    subtotal,
    shippingFee,
    discount,
    appliedCoupon: couponInfo,
    total,
    freeShippingThreshold: 500000,
    amountToFreeShipping: Math.max(0, 500000 - subtotal),
    updatedAt: cart.updatedAt ? cart.updatedAt.toISOString() : new Date().toISOString(),
  };
}

/**
 * Lấy thông tin chi tiết giỏ hàng từ MySQL
 */
async function getCart(identityId) {
  const cart = await getOrCreateCart(identityId);
  return calculateCartTotals(cart);
}

/**
 * Thêm sản phẩm vào giỏ hàng MySQL
 */
async function addItem(identityId, { productId, size, color, quantity = 1, image, name, price, category }) {
  // 1. Tìm thông tin sản phẩm trong MySQL
  let product = null;
  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
    });
  }

  // Fallback nếu không có trong DB
  if (!product) {
    product = fallbackProducts.find((p) => p.id === productId);
  }

  if (!product) {
    if (productId && (name || price)) {
      product = {
        id: productId,
        name: name || 'Sản phẩm',
        categorySlug: category || 'general',
        gender: 'unisex',
        price: Number(price) || 0,
        originalPrice: Number(price) || 0,
        images: image ? [image] : [],
        sizes: size ? [size] : ['M'],
        colors: color ? [color] : ['Đen'],
      };
    } else {
      const error = new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
      error.statusCode = 404;
      throw error;
    }
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    const error = new Error('Số lượng sản phẩm phải là số nguyên dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  // Phân giải ảnh đại diện
  let itemImage = image;
  if (!itemImage) {
    if (Array.isArray(product.images) && product.images.length > 0) {
      itemImage = product.images[0];
    } else if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        itemImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : product.images;
      } catch {
        itemImage = product.images;
      }
    }
  }

  const selectedSize = size || (Array.isArray(product.sizes) ? product.sizes[0] : 'M');
  const selectedColor = color || (Array.isArray(product.colors) ? product.colors[0] : 'Đen');
  const lineId = makeLineId(product.id, selectedSize, selectedColor);

  const cart = await getOrCreateCart(identityId);

  // Kiểm tra dòng sản phẩm đã tồn tại trong giỏ chưa
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_lineId: {
        cartId: cart.id,
        lineId,
      },
    },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + qty,
        image: existingItem.image || itemImage || '',
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        lineId,
        name: product.name,
        category: product.categorySlug || product.categoryId || category || 'clothing',
        gender: product.gender || 'unisex',
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : Number(product.price),
        image: itemImage || '',
        size: selectedSize,
        color: selectedColor,
        quantity: qty,
      },
    });
  }

  // Cập nhật updatedAt của Cart
  const updatedCart = await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() },
    include: {
      items: { orderBy: { createdAt: 'desc' } },
    },
  });

  return calculateCartTotals(updatedCart);
}

/**
 * Thêm combo nhiều sản phẩm cùng lúc (VD: Mua cả bộ Smart Outfit)
 */
async function addBulkItems(identityId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Danh sách sản phẩm bulk thêm vào giỏ không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  for (const item of items) {
    await addItem(identityId, item);
  }

  return getCart(identityId);
}

/**
 * Cập nhật số lượng của một dòng sản phẩm
 */
async function updateItemQuantity(identityId, lineId, quantity) {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty)) {
    const error = new Error('Số lượng không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const cart = await getOrCreateCart(identityId);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_lineId: {
        cartId: cart.id,
        lineId,
      },
    },
  });

  if (!existingItem) {
    const error = new Error(`Không tìm thấy dòng sản phẩm ${lineId} trong giỏ hàng`);
    error.statusCode = 404;
    throw error;
  }

  if (qty <= 0) {
    await prisma.cartItem.delete({
      where: { id: existingItem.id },
    });
  } else {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: qty },
    });
  }

  const updatedCart = await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() },
    include: {
      items: { orderBy: { createdAt: 'desc' } },
    },
  });

  return calculateCartTotals(updatedCart);
}

/**
 * Xóa một dòng sản phẩm
 */
async function removeItem(identityId, lineId) {
  const cart = await getOrCreateCart(identityId);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_lineId: {
        cartId: cart.id,
        lineId,
      },
    },
  });

  if (!existingItem) {
    const error = new Error(`Không tìm thấy dòng sản phẩm ${lineId} trong giỏ hàng`);
    error.statusCode = 404;
    throw error;
  }

  await prisma.cartItem.delete({
    where: { id: existingItem.id },
  });

  const updatedCart = await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() },
    include: {
      items: { orderBy: { createdAt: 'desc' } },
    },
  });

  return calculateCartTotals(updatedCart);
}

/**
 * Xóa toàn bộ giỏ hàng
 */
async function clearCart(identityId) {
  const cart = await getOrCreateCart(identityId);

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  const updatedCart = await prisma.cart.update({
    where: { id: cart.id },
    data: {
      appliedCoupon: null,
      updatedAt: new Date(),
    },
    include: {
      items: true,
    },
  });

  return calculateCartTotals(updatedCart);
}

/**
 * Áp dụng mã giảm giá
 */
async function applyCoupon(identityId, code) {
  if (!code || typeof code !== 'string') {
    const error = new Error('Vui lòng nhập mã giảm giá');
    error.statusCode = 400;
    throw error;
  }

  const normalizedCode = code.trim().toUpperCase();
  let coupon = null;
  try {
    const dbCoupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
    if (dbCoupon && dbCoupon.isActive) {
      coupon = dbCoupon;
    }
  } catch {
    // ignore
  }
  if (!coupon) {
    coupon = AVAILABLE_COUPONS[normalizedCode] || null;
  }

  if (!coupon || coupon.isActive === false) {
    const error = new Error(`Mã giảm giá "${normalizedCode}" không hợp lệ hoặc đã hết hạn`);
    error.statusCode = 400;
    throw error;
  }

  const cart = await getOrCreateCart(identityId);
  const totals = await calculateCartTotals(cart);

  if (totals.subtotal < coupon.minOrderValue) {
    const error = new Error(
      `Đơn hàng chưa đạt giá trị tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã ${coupon.code}`
    );
    error.statusCode = 400;
    throw error;
  }

  const updatedCart = await prisma.cart.update({
    where: { id: cart.id },
    data: {
      appliedCoupon: normalizedCode,
      updatedAt: new Date(),
    },
    include: {
      items: { orderBy: { createdAt: 'desc' } },
    },
  });

  return calculateCartTotals(updatedCart);
}

/**
 * Hủy mã giảm giá
 */
async function removeCoupon(identityId) {
  const cart = await getOrCreateCart(identityId);

  const updatedCart = await prisma.cart.update({
    where: { id: cart.id },
    data: {
      appliedCoupon: null,
      updatedAt: new Date(),
    },
    include: {
      items: { orderBy: { createdAt: 'desc' } },
    },
  });

  return calculateCartTotals(updatedCart);
}

/**
 * Gộp giỏ hàng từ Guest Session vào User Account khi đăng nhập
 */
async function mergeCart(guestSessionId, userIdentityId) {
  const cleanGuestId = String(guestSessionId || '').trim().replace(/^(guest_)+/, '');
  if (!cleanGuestId) {
    return getCart(userIdentityId);
  }

  const guestCart = await prisma.cart.findFirst({
    where: {
      OR: [
        { guestSessionId: cleanGuestId },
        { guestSessionId: `guest_${cleanGuestId}` },
      ],
    },
    include: { items: true },
  });

  if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
    return getCart(userIdentityId);
  }

  const userCart = await getOrCreateCart(userIdentityId);

  for (const guestItem of guestCart.items) {
    const existingInUser = await prisma.cartItem.findUnique({
      where: {
        cartId_lineId: {
          cartId: userCart.id,
          lineId: guestItem.lineId,
        },
      },
    });

    if (existingInUser) {
      await prisma.cartItem.update({
        where: { id: existingInUser.id },
        data: {
          quantity: existingInUser.quantity + guestItem.quantity,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: guestItem.productId,
          lineId: guestItem.lineId,
          name: guestItem.name,
          category: guestItem.category,
          gender: guestItem.gender,
          price: guestItem.price,
          originalPrice: guestItem.originalPrice,
          image: guestItem.image,
          size: guestItem.size,
          color: guestItem.color,
          quantity: guestItem.quantity,
        },
      });
    }
  }

  // Xóa giỏ của guest sau khi đã gộp thành công
  try {
    await prisma.cart.delete({
      where: { id: guestCart.id },
    });
  } catch {
    // ignore delete error
  }

  return getCart(userIdentityId);
}

module.exports = {
  getCart,
  addItem,
  addBulkItems,
  updateItemQuantity,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeCart,
  AVAILABLE_COUPONS,
};
