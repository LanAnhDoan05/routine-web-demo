// Shared constants for the Checkout → Payment → Order flow.
// Centralized so Cart, Checkout, Payment and Order Detail all agree
// on the same labels/fees/status order.

// Bảng giá vận chuyển 5 bậc khoảng cách tính từ điểm gốc: Shop Routine tại Quận 1, TP. Hồ Chí Minh
// Rẻ nhất: 30k (Standard) và 50k (Express) khi ở nội thành TP.HCM, càng xa càng thêm tiền.
export const SHIPPING_RATES = {
  tier1: {
    name: "Nội thành TP.HCM (Gốc Q.1)",
    standard: 30000,
    express: 50000,
    etaStandard: "1–2 ngày làm việc",
    etaExpress: "2–4 giờ hoặc trong ngày"
  },
  tier2: {
    name: "Đông Nam Bộ & Cận TP.HCM",
    standard: 35000,
    express: 80000,
    etaStandard: "2–3 ngày làm việc",
    etaExpress: "24 giờ"
  },
  tier3: {
    name: "Tây Nam Bộ & Nam Trung Bộ",
    standard: 40000,
    express: 90000,
    etaStandard: "3–4 ngày làm việc",
    etaExpress: "1–2 ngày làm việc"
  },
  tier4: {
    name: "Duyên hải Miền Trung & Tây Nguyên",
    standard: 45000,
    express: 100000,
    etaStandard: "3–5 ngày làm việc",
    etaExpress: "2 ngày làm việc"
  },
  tier5: {
    name: "Bắc Trung Bộ & Miền Bắc (Hà Nội, Hải Phòng...)",
    standard: 50000,
    express: 120000,
    etaStandard: "4–6 ngày làm việc",
    etaExpress: "2–3 ngày làm việc"
  }
};

export const DEFAULT_SHIPPING_METHOD = "standard";

export const SHIPPING_METHODS = {
  standard: {
    id: "standard",
    label: "Standard Delivery",
    fee: SHIPPING_RATES.tier1.standard,
    eta: SHIPPING_RATES.tier1.etaStandard
  },
  express: {
    id: "express",
    label: "Express Delivery",
    fee: SHIPPING_RATES.tier1.express,
    eta: SHIPPING_RATES.tier1.etaExpress
  }
};

// Loại bỏ dấu tiếng Việt để so khớp địa danh
export function removeVietnameseTones(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

// Băm chuỗi FNV-1a để phân bổ đều các mức giá khi địa chỉ không khớp từ khóa
function hashLocationKey(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/**
 * Xác định phân vùng khoảng cách (Tier 1 đến 5) từ điểm gốc Quận 1, TP.HCM
 */
export function getShippingTier(address) {
  if (!address) return "tier1";

  let fullText = "";
  if (typeof address === "string") {
    fullText = address;
  } else if (typeof address === "object") {
    fullText = [
      address.city || address.province || "",
      address.district || "",
      address.ward || "",
      address.address || address.street || ""
    ].filter(Boolean).join(" ");
  }

  const normalized = removeVietnameseTones(fullText);
  if (!normalized) return "tier1";

  // Tier 1: TP. Hồ Chí Minh (Gốc shop ở Quận 1)
  if (
    normalized.includes("ho chi minh") ||
    normalized.includes("tphcm") ||
    normalized.includes("tp hcm") ||
    normalized.includes("sai gon") ||
    normalized.includes("quan 1") ||
    normalized.includes("quan 3") ||
    normalized.includes("quan 5") ||
    normalized.includes("quan 7") ||
    normalized.includes("quan 10") ||
    normalized.includes("thu duc") ||
    normalized.includes("binh thanh") ||
    normalized.includes("phu nhuan") ||
    normalized.includes("tan binh") ||
    normalized.includes("tan phu") ||
    normalized.includes("go vap")
  ) {
    return "tier1";
  }

  // Tier 2: Đông Nam Bộ & các tỉnh giáp ranh TP.HCM (~30-120 km)
  if (
    normalized.includes("binh duong") ||
    normalized.includes("dong nai") ||
    normalized.includes("long an") ||
    normalized.includes("ba ria") ||
    normalized.includes("vung tau") ||
    normalized.includes("tay ninh") ||
    normalized.includes("tien giang")
  ) {
    return "tier2";
  }

  // Tier 3: Đồng bằng Sông Cửu Long (Tây Nam Bộ) & Nam Trung Bộ cận (~120-350 km)
  if (
    normalized.includes("can tho") ||
    normalized.includes("ben tre") ||
    normalized.includes("vinh long") ||
    normalized.includes("tra vinh") ||
    normalized.includes("dong thap") ||
    normalized.includes("hau giang") ||
    normalized.includes("soc trang") ||
    normalized.includes("bac lieu") ||
    normalized.includes("ca mau") ||
    normalized.includes("an giang") ||
    normalized.includes("kien giang") ||
    normalized.includes("binh phuoc") ||
    normalized.includes("binh thuan") ||
    normalized.includes("ninh thuan") ||
    normalized.includes("lam dong") ||
    normalized.includes("da lat") ||
    normalized.includes("dak nong")
  ) {
    return "tier3";
  }

  // Tier 4: Duyên hải Nam Trung Bộ & Tây Nguyên (~350-750 km)
  if (
    normalized.includes("khanh hoa") ||
    normalized.includes("nha trang") ||
    normalized.includes("phu yen") ||
    normalized.includes("tuy hoa") ||
    normalized.includes("binh dinh") ||
    normalized.includes("quy nhon") ||
    normalized.includes("quang ngai") ||
    normalized.includes("quang nam") ||
    normalized.includes("hoi an") ||
    normalized.includes("dak lak") ||
    normalized.includes("buon ma thuot") ||
    normalized.includes("gia lai") ||
    normalized.includes("pleiku") ||
    normalized.includes("kon tum")
  ) {
    return "tier4";
  }

  // Tier 5: Miền Trung (Bắc Trung Bộ) & Toàn bộ Miền Bắc (> 750 km, xa nhất)
  if (
    normalized.includes("da nang") ||
    normalized.includes("thua thien hue") ||
    normalized.includes("hue") ||
    normalized.includes("quang tri") ||
    normalized.includes("quang binh") ||
    normalized.includes("ha tinh") ||
    normalized.includes("nghe an") ||
    normalized.includes("thanh hoa") ||
    normalized.includes("ha noi") ||
    normalized.includes("hai phong") ||
    normalized.includes("quang ninh") ||
    normalized.includes("bac ninh") ||
    normalized.includes("hai duong") ||
    normalized.includes("hung yen") ||
    normalized.includes("nam dinh") ||
    normalized.includes("ninh binh") ||
    normalized.includes("thai binh") ||
    normalized.includes("vinh phuc") ||
    normalized.includes("phu tho") ||
    normalized.includes("thai nguyen") ||
    normalized.includes("bac giang") ||
    normalized.includes("lang son") ||
    normalized.includes("cao bang") ||
    normalized.includes("bac kan") ||
    normalized.includes("tuyen quang") ||
    normalized.includes("ha giang") ||
    normalized.includes("yen bai") ||
    normalized.includes("lao cai") ||
    normalized.includes("lai chau") ||
    normalized.includes("dien bien") ||
    normalized.includes("son la") ||
    normalized.includes("hoa binh")
  ) {
    return "tier5";
  }

  // Nếu không nhận diện được tên tỉnh rõ ràng, băm chuỗi để ngẫu nhiên vào 1 trong 5 bậc
  const tiers = ["tier1", "tier2", "tier3", "tier4", "tier5"];
  const index = hashLocationKey(normalized) % tiers.length;
  return tiers[index];
}

/**
 * Tính mức giảm giá tiền ship Standard (Viettel Post giá gốc 30.000đ)
 * - Đơn từ 700k: giảm 20% tối đa 15k tiền ship (giảm 6k -> còn 24k)
 * - Đơn từ 1.000k (1tr): giảm 30% tối đa 50k tiền ship (giảm 9k -> còn 21k)
 * - Đơn từ 1.500k (1.5tr): giảm 50% tối đa 50k tiền ship (giảm 15k -> còn 15k)
 */
export function calculateStandardShipping(subtotal = 0) {
  const baseFee = 30000;
  const sub = Number(subtotal) || 0;
  let discount = 0;
  let discountNote = "";

  if (sub >= 1500000) {
    discount = Math.min(Math.round(baseFee * 0.5), 50000); // 15.000đ
    discountNote = "Giảm 50% tiền ship (Đơn từ 1.500.000đ)";
  } else if (sub >= 1000000) {
    discount = Math.min(Math.round(baseFee * 0.3), 50000); // 9.000đ
    discountNote = "Giảm 30% tiền ship (Đơn từ 1.000.000đ)";
  } else if (sub >= 700000) {
    discount = Math.min(Math.round(baseFee * 0.2), 15000); // 6.000đ
    discountNote = "Giảm 20% tiền ship (Đơn từ 700.000đ)";
  }

  const finalFee = Math.max(0, baseFee - discount);
  return {
    baseFee,
    discount,
    discountNote,
    finalFee,
  };
}

/**
 * Tính cước Ship Hỏa Tốc (Nhân viên showroom đi ship):
 * - Điều kiện: Khoảng cách < 30km so với showroom gần nhất
 * - < 5km: Miễn phí (0đ)
 * - 5km - 10km: 50.000đ
 * - 10km - 20km: 70.000đ
 * - 20km - 30km: 100.000đ
 * - >= 30km: Không khả dụng
 */
export function calculateExpressShipping(distanceKm = null, nearestStore = null) {
  const dist = distanceKm !== null && distanceKm !== undefined ? Number(distanceKm) : null;

  if (dist === null) {
    return {
      available: false,
      fee: 0,
      isFree: false,
      distanceKm: null,
      reason: "Vui lòng nhập và xác thực địa chỉ để tính khoảng cách.",
    };
  }

  if (dist >= 30) {
    return {
      available: false,
      fee: 100000,
      isFree: false,
      distanceKm: dist,
      reason: `Khoảng cách ${dist} km vượt quá bán kính hỗ trợ hỏa tốc 30 km từ ${nearestStore?.name || "cửa hàng"}.`,
    };
  }

  let fee = 0;
  let isFree = false;
  let reason = "";

  if (dist < 5) {
    fee = 0;
    isFree = true;
    reason = "Miễn phí hỏa tốc (< 5km từ cửa hàng)";
  } else if (dist < 10) {
    fee = 50000;
  } else if (dist < 20) {
    fee = 70000;
  } else {
    fee = 100000;
  }

  return {
    available: true,
    fee,
    isFree,
    distanceKm: dist,
    reason,
  };
}

/**
 * Lấy danh sách phương thức vận chuyển với phí cập nhật theo địa chỉ và giá trị giỏ hàng
 */
export function getShippingMethods(address = null, subtotal = 0) {
  const std = calculateStandardShipping(subtotal);
  const dist = address?.nearestStore?.distanceKm ?? null;
  const store = address?.nearestStore ?? null;
  const exp = calculateExpressShipping(dist, store);

  return {
    standard: {
      id: "standard",
      label: "Ship Tiêu Chuẩn (Viettel Post)",
      provider: "Viettel Post",
      baseFee: std.baseFee,
      discount: std.discount,
      discountNote: std.discountNote,
      fee: std.finalFee,
      eta: "2–4 ngày làm việc",
      available: true,
    },
    express: {
      id: "express",
      label: "Ship Hỏa Tốc (Nhân viên cửa hàng)",
      provider: store?.name ? `Showroom Routine ${store.name}` : "Showroom Routine",
      fee: exp.fee,
      isFree: exp.isFree,
      eta: "Giao ngay trong 1–2 giờ",
      available: exp.available,
      reason: exp.reason,
      distanceKm: exp.distanceKm,
      nearestStore: store,
    },
  };
}

/**
 * Tính phí giao hàng theo phương thức, địa chỉ và giá trị giỏ hàng
 */
export function getShippingFee(methodId = "standard", address = null, subtotal = 0) {
  const isExp = String(methodId || "standard").toLowerCase() === "express";
  if (isExp) {
    const dist = address?.nearestStore?.distanceKm ?? null;
    const store = address?.nearestStore ?? null;
    const exp = calculateExpressShipping(dist, store);
    return exp.fee;
  }
  const std = calculateStandardShipping(subtotal);
  return std.finalFee;
}

export const PAYMENT_METHODS = [
  { id: "cod", label: "COD", description: "Thanh toán khi nhận hàng" },
  { id: "card", label: "Credit / Debit Card", description: "Thanh toán bằng thẻ" },
  { id: "vnpay", label: "VNPay", description: "Chuyển tới cổng thanh toán VNPay" },
  { id: "momo", label: "MoMo", description: "Chuyển tới cổng thanh toán MoMo" }
];

export const PAYMENT_METHOD_LABELS = {
  cod: "Cash on Delivery",
  card: "Credit / Debit Card",
  vnpay: "VNPay",
  momo: "MoMo"
};

// Canonical order status flow, in progression order. "cancelled" is a
// terminal state handled separately from the linear timeline.
export const ORDER_STATUS_FLOW = ["pending", "confirmed", "processing", "shipping", "delivered"];

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipping: "Shipping",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

export const ORDER_FILTERS = [
  { label: "All", value: null },
  { label: "Processing", value: "processing" },
  { label: "Shipping", value: "shipping" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" }
];

export function getOrderStatusStepIndex(status) {
  return ORDER_STATUS_FLOW.indexOf(status);
}

export function canCancelOrder(status) {
  return ["pending", "confirmed", "processing"].includes(status);
}
