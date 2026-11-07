const prisma = require('../config/prisma');

// Tọa độ chuẩn của 25 showroom Routine trên toàn quốc
const STORE_COORDINATES = {
  // TP.HCM & Lân cận (12 cửa hàng)
  "routine-le-loi": { lat: 10.7744, lng: 106.7011, name: "Routine Lê Lợi", city: "TP. Hồ Chí Minh" },
  "routine-u-space-su-van-hanh": { lat: 10.7738, lng: 106.6687, name: "Routine U SPACE Sư Vạn Hạnh", city: "TP. Hồ Chí Minh" },
  "routine-go-vap-flagship-store": { lat: 10.8354, lng: 106.6669, name: "Routine Gò Vấp Flagship Store", city: "TP. Hồ Chí Minh" },
  "routine-vo-van-ngan": { lat: 10.8509, lng: 106.7645, name: "Routine Võ Văn Ngân", city: "TP. Hồ Chí Minh" },
  "routine-vung-tau": { lat: 10.3524, lng: 107.0812, name: "Routine Vũng Tàu", city: "Bà Rịa - Vũng Tàu" },
  "routine-hoa-lan": { lat: 10.7967, lng: 106.6896, name: "Routine Hoa Lan", city: "TP. Hồ Chí Minh" },
  "routine-au-co": { lat: 10.7925, lng: 106.6437, name: "Routine Âu Cơ", city: "TP. Hồ Chí Minh" },
  "routine-nguyen-thi-thap": { lat: 10.7388, lng: 106.7093, name: "Routine Nguyễn Thị Thập", city: "TP. Hồ Chí Minh" },
  "routine-gv": { lat: 10.8282, lng: 106.6789, name: "Routine GV", city: "TP. Hồ Chí Minh" },
  "routine-binh-duong": { lat: 10.9786, lng: 106.6575, name: "Routine Bình Dương", city: "Bình Dương" },
  "routine-aeon-mall-tan-phu": { lat: 10.8016, lng: 106.6178, name: "Routine Aeon Mall Tân Phú", city: "TP. Hồ Chí Minh" },
  "routine-aeon-mall-binh-tan": { lat: 10.7428, lng: 106.6115, name: "Routine Aeon Mall Bình Tân", city: "TP. Hồ Chí Minh" },

  // Hà Nội (5 cửa hàng)
  "routine-chua-boc": { lat: 21.0076, lng: 105.8291, name: "Routine Chùa Bộc", city: "Hà Nội" },
  "routine-aeon-mall-long-bien": { lat: 21.0261, lng: 105.9018, name: "Routine Aeon Mall Long Biên", city: "Hà Nội" },
  "routine-aeon-mall-ha-dong": { lat: 20.9784, lng: 105.7538, name: "Routine Aeon Mall Hà Đông", city: "Hà Nội" },
  "routine-mai-hac-de": { lat: 21.0116, lng: 105.8502, name: "Routine Mai Hắc Đế", city: "Hà Nội" },
  "routine-cau-giay": { lat: 21.0336, lng: 105.7972, name: "Routine Cầu Giấy", city: "Hà Nội" },

  // Đà Nẵng (2 cửa hàng)
  "routine-nguyen-van-thoai": { lat: 16.0562, lng: 108.2392, name: "Routine Nguyễn Văn Thoại", city: "Đà Nẵng" },
  "routine-da-nang-le-duan": { lat: 16.0694, lng: 108.2125, name: "Routine Đà Nẵng", city: "Đà Nẵng" },

  // Hải Phòng (1 cửa hàng)
  "routine-aeon-mall-hai-phong": { lat: 20.8358, lng: 106.6917, name: "Routine Aeon Mall Hải Phòng", city: "Hải Phòng" },

  // Lào Cai (1 cửa hàng)
  "routine-lao-cai": { lat: 22.4839, lng: 103.9715, name: "Routine Lào Cai", city: "Lào Cai" },

  // Lạng Sơn (1 cửa hàng)
  "routine-lang-son": { lat: 21.8491, lng: 106.7578, name: "Routine Lạng Sơn", city: "Lạng Sơn" },

  // Gia Lai (1 cửa hàng)
  "routine-gia-lai": { lat: 13.9818, lng: 108.0039, name: "Routine Gia Lai", city: "Gia Lai" },

  // Quảng Ngãi (1 cửa hàng)
  "routine-quang-ngai": { lat: 15.1225, lng: 108.7997, name: "Routine Quảng Ngãi", city: "Quảng Ngãi" },

  // Cà Mau (1 cửa hàng)
  "routine-ca-mau": { lat: 9.1764, lng: 105.1524, name: "Routine Cà Mau", city: "Cà Mau" },
};

/**
 * Công thức Haversine tính khoảng cách đường thẳng giữa 2 tọa độ GPS (km)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Làm tròn 1 chữ số thập phân (VD: 4.2 km)
}

/**
 * Chuẩn hóa chuỗi tiếng Việt không dấu để so khớp từ khóa địa lý
 */
function normalizeText(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();
}

/**
 * Danh sách 63 tỉnh/thành phố chuẩn của Việt Nam
 */
const VN_PROVINCES = [
  'ha noi', 'ho chi minh', 'hcm', 'tphcm', 'tp hcm', 'sai gon', 'hai phong', 'da nang', 'can tho',
  'an giang', 'ba ria', 'vung tau', 'bac giang', 'bac kan', 'bac lieu', 'bac ninh', 'ben tre',
  'binh dinh', 'binh duong', 'binh phuoc', 'binh thuan', 'ca mau', 'cao bang', 'dak lak', 'dak nong',
  'dien bien', 'dong nai', 'dong thap', 'gia lai', 'ha giang', 'ha nam', 'ha tinh', 'hai duong',
  'hau giang', 'hoa binh', 'hung yen', 'khanh hoa', 'nha trang', 'kien giang', 'kon tum', 'lai chau',
  'lam dong', 'da lat', 'lang son', 'lao cai', 'long an', 'nam dinh', 'nghe an', 'vinh', 'ninh binh',
  'ninh thuan', 'phu tho', 'phu yen', 'quang binh', 'quang nam', 'quang ngai', 'quang ninh', 'ha long',
  'quang tri', 'soc trang', 'son la', 'tay ninh', 'thai binh', 'thai nguyen', 'thanh hoa', 'hue',
  'thua thien hue', 'tien giang', 'my tho', 'tra vinh', 'tuyen quang', 'vinh long', 'vinh phuc', 'yen bai'
];

function isKnownProvince(city) {
  const norm = normalizeText(city).trim();
  if (norm.length < 2) return false;
  return VN_PROVINCES.some((p) => norm.includes(p));
}

/**
 * Gọi Google Maps Geocoding API hoặc Nominatim fallback để xác minh khu vực hành chính (Phường/Xã, Quận/Huyện, Tỉnh/Thành)
 */
async function geocodeAddress(addressText, components = {}) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Xây dựng danh sách truy vấn khu vực hành chính
  const adminQueries = [];
  const ward = (components.ward || "").trim();
  const district = (components.district || "").trim();
  const city = (components.city || "").trim();

  if (ward && district && city) {
    adminQueries.push(`${ward}, ${district}, ${city}`);
  }
  if (district && city) {
    adminQueries.push(`${district}, ${city}`);
  }
  if (ward && city) {
    adminQueries.push(`${ward}, ${city}`);
  }
  if (city) {
    adminQueries.push(city);
  }
  if (adminQueries.length === 0 && addressText) {
    adminQueries.push(addressText.replace(/Việt Nam/gi, "").trim());
  }

  // 1. Thử gọi Google Maps Geocoding API nếu đã cấu hình API Key
  if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("YOUR_")) {
    for (const q of adminQueries) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          q
        )}&key=${apiKey}&components=country:VN&language=vi`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const top = data.results[0];
          return {
            valid: true,
            lat: top.geometry.location.lat,
            lng: top.geometry.location.lng,
            formattedAddress: top.formatted_address,
            source: "google_maps",
          };
        }
      } catch (err) {
        console.warn("[shippingService] Google Geocoding API error, fallback to OSM:", err.message);
        break;
      }
    }
  }

  // 2. Fallback Nominatim / OpenStreetMap Geocoding (Miễn phí, chuẩn xác toàn cầu)
  for (const query of adminQueries) {
    try {
      const qWithCountry = query + ", Việt Nam";
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        qWithCountry
      )}&format=json&countrycodes=vn&limit=1&accept-language=vi`;

      const res = await fetch(osmUrl, {
        headers: {
          "User-Agent": "RoutineWebECommerce/1.0 (contact@routine.vn)",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const top = data[0];
          return {
            valid: true,
            lat: parseFloat(top.lat),
            lng: parseFloat(top.lon),
            formattedAddress: top.display_name,
            source: "nominatim_osm",
          };
        }
      }
    } catch (err) {
      console.warn("[shippingService] Nominatim OSM query error:", err.message);
    }
  }

  // 3. Fallback theo danh mục hành chính quận/huyện/thành phố nội bộ
  const fallbackCoord = getApproxCoordinatesFromText(adminQueries.join(", "), components);
  if (fallbackCoord) {
    return {
      valid: true,
      lat: fallbackCoord.lat,
      lng: fallbackCoord.lng,
      formattedAddress: adminQueries[0] || addressText,
      source: "local_vn_directory",
    };
  }

  return {
    valid: false,
    message: "Khu vực Phường/Xã, Quận/Huyện hoặc Tỉnh/Thành phố không thể định vị. Vui lòng kiểm tra lại tên đơn vị hành chính.",
  };
}

/**
 * Tọa độ dự phòng cho các tỉnh thành phố chính của Việt Nam theo phân cấp địa lý
 */
function getApproxCoordinatesFromText(text, components = {}) {
  const norm = normalizeText(text);
  const normCity = normalizeText(components.city || "");
  const normDistrict = normalizeText(components.district || "");

  // Kiểm tra nếu chuỗi chỉ gồm ký tự linh tinh vô nghĩa (< 6 ký tự hoặc toàn chữ ngẫu nhiên)
  if (norm.length < 6 || /^([a-z0-9])\1+$/.test(norm)) return null;

  // 1. Phân vùng HÀ NỘI
  const isHanoi =
    normCity.includes("ha noi") ||
    normCity.includes("hn") ||
    norm.includes("ha noi") ||
    norm.includes("tp ha noi") ||
    norm.includes("thu do");

  if (isHanoi) {
    if (norm.includes("dong da") || norm.includes("chua boc") || normDistrict.includes("dong da"))
      return { lat: 21.0076, lng: 105.8291 };
    if (norm.includes("long bien") || normDistrict.includes("long bien"))
      return { lat: 21.0261, lng: 105.9018 };
    if (norm.includes("ha dong") || normDistrict.includes("ha dong"))
      return { lat: 20.9784, lng: 105.7538 };
    if (norm.includes("cau giay") || normDistrict.includes("cau giay"))
      return { lat: 21.0336, lng: 105.7972 };
    if (norm.includes("hai ba trung") || norm.includes("mai hac de") || normDistrict.includes("hai ba trung"))
      return { lat: 21.0116, lng: 105.8502 };
    if (norm.includes("hoan kiem") || norm.includes("ba dinh"))
      return { lat: 21.0313, lng: 105.8450 };
    if (norm.includes("thanh xuan"))
      return { lat: 20.9980, lng: 105.8120 };
    if (norm.includes("tay ho"))
      return { lat: 21.0664, lng: 105.8236 };
    return { lat: 21.0285, lng: 105.8542 }; // Trung tâm Hà Nội
  }

  // 2. Phân vùng TP. HỒ CHÍ MINH
  const isHcm =
    normCity.includes("ho chi minh") ||
    normCity.includes("tphcm") ||
    normCity.includes("tp hcm") ||
    normCity.includes("sai gon") ||
    normCity.includes("hcm") ||
    norm.includes("ho chi minh") ||
    norm.includes("tphcm") ||
    norm.includes("tp hcm") ||
    norm.includes("sai gon");

  if (isHcm) {
    if (norm.includes("quan 1") || norm.includes("ben nghe") || norm.includes("le loi") || normDistrict === "1")
      return { lat: 10.7744, lng: 106.7011 };
    if (norm.includes("quan 10") || norm.includes("su van hanh") || normDistrict === "10")
      return { lat: 10.7738, lng: 106.6687 };
    if (norm.includes("go vap") || normDistrict.includes("go vap"))
      return { lat: 10.8354, lng: 106.6669 };
    if (norm.includes("thu duc") || norm.includes("vo van ngan") || normDistrict.includes("thu duc"))
      return { lat: 10.8509, lng: 106.7645 };
    if (norm.includes("tan phu") || norm.includes("au co") || normDistrict.includes("tan phu"))
      return { lat: 10.7925, lng: 106.6437 };
    if (norm.includes("phu nhuan") || norm.includes("hoa lan") || normDistrict.includes("phu nhuan"))
      return { lat: 10.7967, lng: 106.6896 };
    if (norm.includes("quan 7") || norm.includes("nguyen thi thap") || normDistrict === "7")
      return { lat: 10.7388, lng: 106.7093 };
    if (norm.includes("binh tan") || normDistrict.includes("binh tan"))
      return { lat: 10.7428, lng: 106.6115 };
    if (norm.includes("binh thanh"))
      return { lat: 10.8014, lng: 106.6984 };
    if (norm.includes("tan binh"))
      return { lat: 10.7992, lng: 106.6531 };
    if (norm.includes("quan 3") || normDistrict === "3")
      return { lat: 10.7797, lng: 106.6859 };
    if (norm.includes("quan 5") || normDistrict === "5")
      return { lat: 10.7554, lng: 106.6644 };
    return { lat: 10.7769, lng: 106.7009 }; // Trung tâm TP.HCM
  }

  // 3. Phân vùng các tỉnh thành có Showroom Routine
  if (norm.includes("da nang")) {
    if (norm.includes("nguyen van thoai") || norm.includes("son tra") || norm.includes("ngu hanh son"))
      return { lat: 16.0562, lng: 108.2392 };
    return { lat: 16.0694, lng: 108.2125 };
  }
  if (norm.includes("hai phong")) return { lat: 20.8358, lng: 106.6917 };
  if (norm.includes("vung tau") || norm.includes("ba ria")) return { lat: 10.3524, lng: 107.0812 };
  if (norm.includes("binh duong") || norm.includes("thu dau mot")) return { lat: 10.9786, lng: 106.6575 };
  if (norm.includes("dong nai") || norm.includes("bien hoa")) return { lat: 10.9574, lng: 106.8427 };
  if (norm.includes("can tho")) return { lat: 10.0452, lng: 105.7469 };
  if (norm.includes("ca mau")) return { lat: 9.1764, lng: 105.1524 };
  if (norm.includes("gia lai") || norm.includes("pleiku")) return { lat: 13.9818, lng: 108.0039 };
  if (norm.includes("quang ngai")) return { lat: 15.1225, lng: 108.7997 };
  if (norm.includes("lao cai")) return { lat: 22.4839, lng: 103.9715 };
  if (norm.includes("lang son")) return { lat: 21.8491, lng: 106.7578 };

  // 4. Nếu không ghi tên tỉnh rõ ràng nhưng có tên đường đặc trưng độc nhất
  if (norm.includes("chua boc") || norm.includes("mai hac de")) return { lat: 21.0076, lng: 105.8291 };
  if (norm.includes("su van hanh") || norm.includes("vo van ngan")) return { lat: 10.7738, lng: 106.6687 };

  return null;
}

/**
 * Tìm showroom Routine gần nhất với tọa độ khách hàng
 */
async function findNearestRoutineStore(lat, lng) {
  let storesList = [];
  try {
    const dbStores = await prisma.store.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, address: true, city: true, phone: true },
    });
    if (dbStores && dbStores.length > 0) {
      storesList = dbStores;
    }
  } catch (err) {
    console.warn("[shippingService] Cannot query DB stores:", err.message);
  }

  let minDistance = Infinity;
  let nearest = null;

  // Duyệt qua tọa độ 25 cửa hàng
  for (const [slug, coord] of Object.entries(STORE_COORDINATES)) {
    const dist = calculateHaversineDistance(lat, lng, coord.lat, coord.lng);
    if (dist < minDistance) {
      minDistance = dist;
      // Tìm thông tin chi tiết từ DB nếu có
      const dbMatch = storesList.find((s) => s.slug === slug);
      nearest = {
        name: dbMatch?.name || coord.name,
        slug: slug,
        address: dbMatch?.address || `${coord.name}, ${coord.city}`,
        city: dbMatch?.city || coord.city,
        phone: dbMatch?.phone || "1900 63 65 91",
        distanceKm: dist,
      };
    }
  }

  return nearest;
}

/**
 * Kiểm tra tính hợp lệ của khu vực hành chính (Phường/Xã, Quận/Huyện, Tỉnh/Thành phố)
 * và tính khoảng cách tới showroom gần nhất.
 * Địa chỉ chi tiết (số nhà, tên đường, căn hộ...) được giữ nguyên để giao hàng và không bắt buộc check bản đồ.
 */
async function validateAndLocateAddress(addressInput) {
  let fullAddress = "";
  let components = {};

  if (typeof addressInput === "string") {
    fullAddress = (addressInput || "").trim();
    const parts = fullAddress.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      components = {
        street: parts.slice(0, parts.length - 3).join(", ") || parts[0],
        ward: parts[parts.length - 3] || "",
        district: parts[parts.length - 2] || "",
        city: parts[parts.length - 1] || "",
      };
    } else {
      components = {
        street: fullAddress,
        ward: "",
        district: parts[0] || "",
        city: parts[parts.length - 1] || "",
      };
    }
  } else if (typeof addressInput === "object" && addressInput !== null) {
    components = {
      street: (addressInput.address || addressInput.street || "").trim(),
      ward: (addressInput.ward || "").trim(),
      district: (addressInput.district || "").trim(),
      city: (addressInput.city || addressInput.province || "").trim(),
    };
    fullAddress = [components.street, components.ward, components.district, components.city]
      .filter(Boolean)
      .join(", ");
  }

  // 1. Kiểm tra không để trống các trường đơn vị hành chính & địa chỉ chi tiết
  if (!components.city) {
    return {
      valid: false,
      message: "Vui lòng chọn hoặc nhập Tỉnh/Thành phố.",
    };
  }

  if (!isKnownProvince(components.city)) {
    return {
      valid: false,
      message: "Tỉnh/Thành phố không hợp lệ hoặc không thuộc Việt Nam. Vui lòng kiểm tra lại.",
    };
  }

  if (!components.district || normalizeText(components.district).length < 2 || /^([a-z0-9])\1+$/i.test(normalizeText(components.district))) {
    return {
      valid: false,
      message: "Quận/Huyện không hợp lệ. Vui lòng kiểm tra lại.",
    };
  }

  if (!components.ward || normalizeText(components.ward).length < 2 || /^([a-z0-9])\1+$/i.test(normalizeText(components.ward))) {
    return {
      valid: false,
      message: "Phường/Xã không hợp lệ. Vui lòng kiểm tra lại.",
    };
  }

  if (!components.street) {
    return {
      valid: false,
      message: "Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường, căn hộ...).",
    };
  }

  // 2. Chỉ Geocode và kiểm tra bản đồ trên Khu vực Hành chính (Phường/Xã, Quận/Huyện, Tỉnh/Thành)
  // Địa chỉ chi tiết (street) KHÔNG bị đem đi kiểm tra bản đồ, giúp tránh lỗi địa chỉ ngõ ngách không có trên Google Maps / OSM
  const adminAreaText = [components.ward, components.district, components.city]
    .filter(Boolean)
    .join(", ");

  const geoResult = await geocodeAddress(adminAreaText, components);
  if (!geoResult.valid) {
    return {
      valid: false,
      message:
        geoResult.message ||
        "Không thể xác định vị trí Phường/Xã, Quận/Huyện hoặc Tỉnh/Thành phố này. Vui lòng kiểm tra lại tên đơn vị hành chính.",
    };
  }

  // Tìm cửa hàng gần nhất theo tọa độ của khu vực hành chính
  const nearestStore = await findNearestRoutineStore(geoResult.lat, geoResult.lng);

  return {
    valid: true,
    formattedAddress: fullAddress, // Giữ trọn vẹn số nhà/tên đường chi tiết khách nhập
    adminArea: adminAreaText,
    coordinates: {
      lat: geoResult.lat,
      lng: geoResult.lng,
    },
    nearestStore,
    source: geoResult.source,
  };
}

/**
 * Tính toán phí vận chuyển theo chính sách Routine:
 * 1. Ship Standard (Viettel Post): 30.000đ
 *    - Đơn từ 700k: Giảm 20% tối đa 15k ship (giảm 6k -> còn 24k)
 *    - Đơn từ 1.000k (1tr): Giảm 30% tối đa 50k ship (giảm 9k -> còn 21k)
 *    - Đơn từ 1.500k (1.5tr): Giảm 50% tối đa 50k ship (giảm 15k -> còn 15k)
 *
 * 2. Ship Hỏa Tốc (Nhân viên cửa hàng giao):
 *    - Điều kiện: Khoảng cách < 30km từ showroom gần nhất
 *    - < 5km: Miễn phí (0đ)
 *    - 5km - 10km: 50.000đ
 *    - 10km - 20km: 70.000đ
 *    - 20km - 30km: 100.000đ
 *    - >= 30km: Không hỗ trợ
 */
function calculateShippingOptions(subtotal = 0, distanceKm = null, nearestStore = null) {
  const sub = Number(subtotal) || 0;
  const dist = distanceKm !== null && distanceKm !== undefined ? Number(distanceKm) : null;

  // --- 1. Ship Standard (Viettel Post) ---
  const standardBaseFee = 30000;
  let standardDiscount = 0;
  let standardDiscountNote = "";

  if (sub >= 1500000) {
    // Đơn từ 1.5tr: giảm 50% tối đa 50k
    standardDiscount = Math.min(Math.round(standardBaseFee * 0.5), 50000); // 15.000đ
    standardDiscountNote = "Giảm 50% tiền ship cho đơn từ 1.500.000đ";
  } else if (sub >= 1000000) {
    // Đơn từ 1tr: giảm 30% tối đa 50k
    standardDiscount = Math.min(Math.round(standardBaseFee * 0.3), 50000); // 9.000đ
    standardDiscountNote = "Giảm 30% tiền ship cho đơn từ 1.000.000đ";
  } else if (sub >= 700000) {
    // Đơn từ 700k: giảm 20% tối đa 15k
    standardDiscount = Math.min(Math.round(standardBaseFee * 0.2), 15000); // 6.000đ
    standardDiscountNote = "Giảm 20% tiền ship cho đơn từ 700.000đ";
  }

  const standardFinalFee = Math.max(0, standardBaseFee - standardDiscount);

  const standardOption = {
    id: "standard",
    label: "Ship Tiêu Chuẩn (Viettel Post)",
    provider: "Viettel Post",
    baseFee: standardBaseFee,
    discount: standardDiscount,
    discountNote: standardDiscountNote,
    fee: standardFinalFee,
    eta: "2–4 ngày làm việc",
    available: true,
  };

  // --- 2. Ship Hỏa Tốc (Nhân viên showroom đi ship) ---
  let expressOption = {
    id: "express",
    label: "Ship Hỏa Tốc (Nhân viên cửa hàng)",
    provider: nearestStore ? `Showroom Routine ${nearestStore.name}` : "Nhân viên Routine",
    baseFee: 0,
    fee: 0,
    distanceKm: dist,
    eta: "Giao ngay trong 1–2 giờ",
    available: false,
    reason: "",
  };

  if (dist === null) {
    expressOption.available = false;
    expressOption.reason = "Vui lòng nhập địa chỉ để kiểm tra khoảng cách đến cửa hàng gần nhất.";
  } else if (dist >= 30) {
    expressOption.available = false;
    expressOption.fee = 100000;
    expressOption.reason = `Khoảng cách hiện tại: ${dist} km (vượt quá bán kính hỗ trợ hỏa tốc 30 km từ ${
      nearestStore?.name || "cửa hàng Routine"
    }).`;
  } else {
    expressOption.available = true;
    if (dist < 5) {
      expressOption.fee = 0;
      expressOption.isFree = true;
      expressOption.reason = "Miễn phí hỏa tốc (dưới 5km từ cửa hàng)";
    } else if (dist < 10) {
      expressOption.fee = 50000;
    } else if (dist < 20) {
      expressOption.fee = 70000;
    } else {
      // 20km - 30km
      expressOption.fee = 100000;
    }
  }

  return {
    subtotal: sub,
    distanceKm: dist,
    nearestStore,
    methods: {
      standard: standardOption,
      express: expressOption,
    },
  };
}

module.exports = {
  validateAndLocateAddress,
  calculateShippingOptions,
  calculateHaversineDistance,
  STORE_COORDINATES,
};
