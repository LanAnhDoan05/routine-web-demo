import { fetchApi } from "./api";

/**
 * Lấy toàn bộ đơn hàng của hệ thống dành cho Admin
 */
export async function fetchAdminOrders({ status, search, source, paymentStatus, customerType, page = 1, limit = 50 } = {}) {
  const queryParams = new URLSearchParams();
  if (status && status !== "ALL") queryParams.append("status", status);
  if (search && search.trim()) queryParams.append("search", search.trim());
  if (source && source !== "ALL") queryParams.append("source", source);
  if (paymentStatus && paymentStatus !== "ALL") queryParams.append("paymentStatus", paymentStatus);
  if (customerType && customerType !== "ALL") queryParams.append("customerType", customerType);
  if (page) queryParams.append("page", String(page));
  if (limit) queryParams.append("limit", String(limit));

  const qs = queryParams.toString();
  const endpoint = `/orders/admin/all${qs ? `?${qs}` : ""}`;
  return await fetchApi(endpoint);
}

/**
 * Lấy chi tiết một đơn hàng theo ID
 */
export async function fetchAdminOrderById(id) {
  return await fetchApi(`/orders/${encodeURIComponent(id)}`);
}

/**
 * Cập nhật trạng thái đơn hàng & trạng thái thanh toán (Admin)
 */
export async function updateAdminOrderStatus(id, status, paymentStatus = null) {
  const body = {};
  if (status) body.status = status;
  if (paymentStatus) body.paymentStatus = paymentStatus;

  return await fetchApi(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * Gửi lại hóa đơn đơn hàng qua Email cho khách hàng
 */
export async function sendAdminOrderInvoice(id, email = null) {
  return await fetchApi(`/orders/${encodeURIComponent(id)}/send-invoice`, {
    method: "POST",
    body: JSON.stringify(email ? { email } : {}),
  });
}
