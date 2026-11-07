// cartService.js
// Quản lý giỏ hàng kết hợp đồng bộ Backend MySQL API và lưu trữ đệm localStorage

import { fetchApi } from "./api";

export function getCartStorageKey(userId = null) {
  return userId ? `routine_cart_user_${userId}` : "routine_cart_guest";
}

export function loadCart(userId = null) {
  if (typeof window === "undefined") return [];
  try {
    const key = getCartStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load cart from storage", err);
    return [];
  }
}

export function saveCart(items, userId = null) {
  if (typeof window === "undefined") return;
  try {
    const key = getCartStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(items || []));
  } catch (err) {
    console.error("Failed to save cart to storage", err);
  }
}

export function clearLocalCart(userId = null) {
  if (typeof window === "undefined") return;
  try {
    if (userId) {
      window.localStorage.removeItem(`routine_cart_user_${userId}`);
    }
    window.localStorage.removeItem("routine_cart_guest");
    window.localStorage.removeItem("routine_cart_v1");
  } catch (err) {
    console.error("Failed to clear local cart from storage", err);
  }
}

export function makeCartLineId(productId, size, color) {
  return `${productId}__${size || "default"}__${color || "default"}`;
}

export function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
}

// ==================== BACKEND DATABASE API SYNC ====================

export async function fetchCartApi() {
  try {
    const res = await fetchApi("/cart");
    return res;
  } catch (err) {
    console.warn("fetchCartApi warning:", err.message);
    return null;
  }
}

export async function addItemApi(payload) {
  try {
    const res = await fetchApi("/cart/items", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  } catch (err) {
    console.warn("addItemApi warning:", err.message);
    return null;
  }
}

export async function addBulkItemsApi(items) {
  try {
    const res = await fetchApi("/cart/items/bulk", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
    return res;
  } catch (err) {
    console.warn("addBulkItemsApi warning:", err.message);
    return null;
  }
}

export async function updateQuantityApi(lineId, quantity) {
  try {
    const res = await fetchApi(`/cart/items/${encodeURIComponent(lineId)}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
    return res;
  } catch (err) {
    console.warn("updateQuantityApi warning:", err.message);
    return null;
  }
}

export async function removeItemApi(lineId) {
  try {
    const res = await fetchApi(`/cart/items/${encodeURIComponent(lineId)}`, {
      method: "DELETE",
    });
    return res;
  } catch (err) {
    console.warn("removeItemApi warning:", err.message);
    return null;
  }
}

export async function clearCartApi() {
  try {
    const res = await fetchApi("/cart", {
      method: "DELETE",
    });
    return res;
  } catch (err) {
    console.warn("clearCartApi warning:", err.message);
    return null;
  }
}

export async function applyCouponApi(code) {
  return fetchApi("/cart/apply-coupon", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function removeCouponApi() {
  return fetchApi("/cart/coupon", {
    method: "DELETE",
  });
}

export async function mergeCartApi(guestSessionId) {
  try {
    return await fetchApi("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ guestSessionId }),
    });
  } catch (err) {
    console.warn("mergeCartApi warning:", err.message);
    return null;
  }
}
