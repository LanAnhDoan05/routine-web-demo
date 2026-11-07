import { fetchApi } from "./api";

/**
 * Gọi backend tạo URL thanh toán VNPay Sandbox
 */
export async function createVNPayPaymentUrl({
  orderId,
  amount,
  orderInfo,
  bankCode = "",
  locale = "vn",
}) {
  try {
    const data = await fetchApi("/payment/vnpay/create-payment-url", {
      method: "POST",
      body: JSON.stringify({
        orderId,
        amount,
        orderInfo,
        bankCode,
        locale,
      }),
    });
    return data;
  } catch (error) {
    console.error("[vnpayService] createVNPayPaymentUrl failed:", error.message);
    throw error;
  }
}

/**
 * Gọi backend xác thực kết quả thanh toán từ Return URL của VNPay
 */
export async function verifyVNPayReturn(searchQueryString) {
  try {
    const qs = searchQueryString.startsWith("?")
      ? searchQueryString.slice(1)
      : searchQueryString;
    const data = await fetchApi(`/payment/vnpay/verify-return?${qs}`);
    return data;
  } catch (error) {
    console.error("[vnpayService] verifyVNPayReturn failed:", error.message);
    throw error;
  }
}
