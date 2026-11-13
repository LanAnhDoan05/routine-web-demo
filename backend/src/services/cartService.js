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
  const cleanUser = idStr.replace(/^user_/, '');
  return { userId: cleanUser };
}


/**
 * Tạo Cart Line ID duy nhất dựa trên productId, size và color
 */
function makeLineId(productId, size, color) {
  return `${productId}__${size || 'default'}__${color || 'default'}`;
}

function productArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function productOptions(value) {
  return productArray(value).filter((option) => typeof option === 'string' && option.trim());
}

function cartError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeCartOption(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
    .toLowerCase();
}

function normalizeColorAlias(value) {
  const normalized = normalizeCartOption(value);
  const aliasMap = {
    'trang': 'white',
    'trang nhat': 'white',
    'trắng': 'white',
    'white': 'white',
    'den': 'black',
    'đen': 'black',
    'black': 'black',
    'xam': 'gray',
    'xám': 'gray',
    'gray': 'gray',
    'grey': 'gray',
    'be': 'beige',
    'beige': 'beige',
    'kem': 'cream',
    'cream': 'cream',
    'navy': 'navy',
    'xanh navy': 'navy',
    'blue': 'blue',
    'xanh duong': 'blue',
    'xanh dương': 'blue',
    'nau': 'brown',
    'brown': 'brown',
    'xanh la': 'green',
    'green': 'green',
    'khaki': 'khaki',
    'olive': 'olive',
  };
  return aliasMap[normalized] || normalized;
}

function normalizeSizeAlias(value) {
  const normalized = normalizeCartOption(value);
  const aliasMap = {
    'xs': 'xs',
    's': 's',
    'm': 'm',
    'l': 'l',
    'xl': 'xl',
    'xxl': 'xxl',
    'xxxl': 'xxxl',
    '29': '29',
    '30': '30',
    '31': '31',
    '32': '32',
    '33': '33',
    '34': '34',
    '35': '35',
    '36': '36',
    '37': '37',
    '38': '38',
    '39': '39',
    '40': '40',
  };
  return aliasMap[normalized] || normalized;
}

function resolveCartSelection(product, { size, color, quantity }) {
  if (!product || product.status !== 'ACTIVE') {
    throw cartError('Sản phẩm không tồn tại hoặc không còn kinh doanh', 404);
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw cartError('Số lượng sản phẩm phải là số nguyên dương lớn hơn 0', 400);
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length > 0) {
    const availableVariants = variants.filter((variant) => (
      variant.status === 'ACTIVE' &&
      Number.isInteger(Number(variant.stockQuantity)) &&
      Number(variant.stockQuantity) > 0
    ));
    const selectedVariant = availableVariants.find((variant) => {
      const variantSize = normalizeSizeAlias(variant.size);
      const variantColor = normalizeColorAlias(variant.color);
      const requestedSize = normalizeSizeAlias(size);
      const requestedColor = normalizeColorAlias(color);
      return variantSize === requestedSize && variantColor === requestedColor;
    });
    if (!selectedVariant) {
      throw cartError('Size hoặc màu đã chọn không còn hàng', 400);
    }

    const availableStock = Number(selectedVariant.stockQuantity);
    if (qty > availableStock) {
      throw cartError('Sản phẩm không đủ tồn kho', 400);
    }

    return {
      size: selectedVariant.size || null,
      color: selectedVariant.color || null,
      price: Number(selectedVariant.price),
      availableStock,
      quantity: qty,
    };
  }

  const availableStock = Number(product.stockQuantity);
  if (!Number.isInteger(availableStock) || availableStock < qty) {
    throw cartError('Sản phẩm không đủ tồn kho hoặc không có dữ liệu tồn kho', 400);
  }

  const sizes = productOptions(product.sizes).map((option) => normalizeSizeAlias(option));
  const colors = productOptions(product.colors).map((option) => normalizeColorAlias(option));
  const requestedSize = normalizeSizeAlias(size);
  const requestedColor = normalizeColorAlias(color);

  if ((sizes.length > 0 && !size) || (colors.length > 0 && !color)) {
    throw cartError('Vui lòng chọn size và màu từ thông tin sản phẩm', 400);
  }
  if ((size && !sizes.includes(requestedSize)) || (color && !colors.includes(requestedColor))) {
    throw cartError('Size hoặc màu đã chọn không hợp lệ', 400);
  }

  return {
    size: size || null,
    color: color || null,
    price: Number(product.price),
    availableStock,
    quantity: qty,
  };
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
    size: item.size || null,
    color: item.color || null,
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
    const coupon = await prisma.coupon.findUnique({ where: { code: cart.appliedCoupon } });

    if (coupon?.isActive) {
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
async function addItem(identityId, { productId, size, color, quantity = 1 }) {
  const product = productId
    ? await prisma.product.findFirst({
      where: { id: productId, status: 'ACTIVE' },
      include: { variants: true },
    })
    : null;
  const selection = resolveCartSelection(product, { size, color, quantity });

  // Phân giải ảnh đại diện
  const productImages = productArray(product.images)
    .map((entry) => typeof entry === 'string' ? entry : entry?.url)
    .filter((entry) => typeof entry === 'string' && entry.trim());
  const itemImage = productImages[0] || '';

  const selectedSize = selection.size;
  const selectedColor = selection.color;
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

  if ((existingItem?.quantity || 0) + selection.quantity > selection.availableStock) {
    throw cartError('Số lượng vượt quá tồn kho hiện có', 400);
  }

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + selection.quantity,
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
        category: product.categorySlug || product.categoryId || '',
        gender: product.gender || 'unisex',
        price: selection.price,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : selection.price,
        image: itemImage || '',
        size: selectedSize,
        color: selectedColor,
        quantity: selection.quantity,
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
  const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } });

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
  resolveCartSelection,
};
