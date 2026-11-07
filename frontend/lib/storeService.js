import { fetchApi } from "./api";

/**
 * Lấy danh sách cửa hàng kèm bộ lọc
 */
export async function fetchAdminStores(params = {}) {
  const query = new URLSearchParams();
  if (params.region && params.region !== "ALL") query.set("region", params.region);
  if (params.city && params.city !== "ALL") query.set("city", params.city);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.search && params.search.trim()) query.set("search", params.search.trim());

  const qs = query.toString();
  const res = await fetchApi(`/stores${qs ? `?${qs}` : ""}`);
  return Array.isArray(res) ? res : (res?.data || []);
}

/**
 * Lấy thống kê tổng quan về hệ thống cửa hàng
 */
export async function fetchStoreStats() {
  const res = await fetchApi("/stores/stats");
  return res?.data || res || {};
}

/**
 * Lấy chi tiết cửa hàng
 */
export async function fetchStoreById(id) {
  const res = await fetchApi(`/stores/${id}`);
  return res?.data || res;
}

/**
 * Tạo mới cửa hàng
 */
export async function createStore(data) {
  const res = await fetchApi("/stores", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

/**
 * Cập nhật thông tin cửa hàng
 */
export async function updateStore(id, data) {
  const res = await fetchApi(`/stores/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

/**
 * Bật/tắt trạng thái hoạt động của cửa hàng
 */
export async function toggleStoreStatus(id) {
  const res = await fetchApi(`/stores/${id}/toggle-status`, {
    method: "PATCH",
  });
  return res?.data || res;
}

/**
 * Xóa cửa hàng
 */
export async function deleteStore(id) {
  const res = await fetchApi(`/stores/${id}`, {
    method: "DELETE",
  });
  return res?.data || res;
}

/**
 * Khôi phục 25 cửa hàng mẫu mặc định của Routine
 */
export async function resetDefaultStores() {
  const res = await fetchApi("/stores/reset-defaults", {
    method: "POST",
  });
  return Array.isArray(res) ? res : (res?.data || []);
}
