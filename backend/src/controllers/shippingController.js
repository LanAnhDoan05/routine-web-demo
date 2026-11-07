const shippingService = require('../services/shippingService');

/**
 * POST /api/v1/shipping/check-address
 * Xác thực địa chỉ với Google Maps / OpenStreetMap và tìm showroom Routine gần nhất
 */
async function checkAddress(req, res) {
  try {
    const { address, ward, district, city, fullAddress } = req.body || {};
    const input = fullAddress || { address, ward, district, city };

    const result = await shippingService.validateAndLocateAddress(input);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: result.message || "Địa chỉ không tồn tại hoặc không thể định vị trên Google Maps. Vui lòng nhập lại.",
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[shippingController] checkAddress error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi trong quá trình định vị địa chỉ. Vui lòng thử lại sau.",
    });
  }
}

/**
 * POST /api/v1/shipping/calculate
 * Tính toán biểu phí ship Tiêu chuẩn (Viettel Post) và Hỏa tốc theo khoảng cách & giá trị đơn hàng
 */
async function calculateShipping(req, res) {
  try {
    const { subtotal, distanceKm, nearestStore } = req.body || {};
    const options = shippingService.calculateShippingOptions(subtotal, distanceKm, nearestStore);

    return res.json({
      success: true,
      data: options,
    });
  } catch (err) {
    console.error("[shippingController] calculateShipping error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tính phí vận chuyển.",
    });
  }
}

module.exports = {
  checkAddress,
  calculateShipping,
};
