import { fetchApi } from "./api";

/**
 * Gọi API xác thực khu vực hành chính (Phường/Xã, Quận/Huyện, Tỉnh/Thành)
 * và tính khoảng cách tới showroom Routine gần nhất
 */
export async function checkAddressApi(addressData) {
  try {
    const res = await fetchApi("/shipping/check-address", {
      method: "POST",
      body: JSON.stringify(addressData),
    });

    // fetchApi tự động unwrap json.data hoặc trả về đối tượng kết quả
    const data = res?.data !== undefined ? res.data : res;

    if (data && typeof data === "object" && typeof data.valid === "boolean") {
      return data;
    }

    if (res && res.success && res.data) {
      return res.data;
    }

    return {
      valid: false,
      message: res?.message || data?.message || "Không thể xác định vị trí đơn vị hành chính này. Vui lòng kiểm tra lại.",
    };
  } catch (err) {
    console.warn("[shippingService] checkAddressApi network/API error, fallback to client resolution:", err.message);

    // Dự phòng Client-side nếu server bị lỗi mạng/timeout để không chặn khách đặt hàng
    const city = (addressData?.city || addressData?.province || "").toLowerCase();
    const district = (addressData?.district || "").trim();
    const ward = (addressData?.ward || "").trim();

    if (city && district && ward) {
      const isHcm = city.includes("ho chi minh") || city.includes("hcm") || city.includes("sai gon");
      const isHn = city.includes("ha noi") || city.includes("hn");

      return {
        valid: true,
        formattedAddress: [addressData.address || addressData.street, ward, district, addressData.city].filter(Boolean).join(", "),
        coordinates: isHcm ? { lat: 10.7769, lng: 106.7009 } : isHn ? { lat: 21.0285, lng: 105.8542 } : { lat: 16.0544, lng: 108.2022 },
        nearestStore: isHcm
          ? { name: "Routine Lê Lợi", distanceKm: 2, city: "TP. Hồ Chí Minh" }
          : isHn
          ? { name: "Routine Chùa Bộc", distanceKm: 2, city: "Hà Nội" }
          : { name: "Routine Đà Nẵng", distanceKm: 2, city: "Đà Nẵng" },
        source: "client_fallback",
      };
    }

    return {
      valid: false,
      message: err?.message || "Không thể kết nối đến máy chủ định vị bản đồ.",
    };
  }
}

/**
 * Tính toán biểu phí ship Standard & Express theo giá trị đơn hàng và khoảng cách
 */
export async function calculateShippingApi(subtotal, distanceKm, nearestStore) {
  try {
    const res = await fetchApi("/shipping/calculate", {
      method: "POST",
      body: JSON.stringify({ subtotal, distanceKm, nearestStore }),
    });

    const data = res?.data !== undefined ? res.data : res;
    if (data && data.methods) {
      return data;
    }
    if (res && res.success && res.data) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.error("Failed to calculate shipping via API:", err);
    return null;
  }
}

