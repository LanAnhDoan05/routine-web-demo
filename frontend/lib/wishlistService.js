// wishlistService.js
// Quản lý danh sách yêu thích ứng với từng tài khoản người dùng kết hợp đồng bộ Backend MySQL API

import { fetchApi } from "./api";

const LEGACY_STORAGE_KEY = "routine_wishlist_v1";

function getStorageKey(userId) {
  return userId ? `routine_wishlist_user_${userId}` : "routine_wishlist_guest";
}

export function loadWishlist(userId = null) {
  if (typeof window === "undefined") return [];
  try {
    // Dọn dẹp key cũ không phân chia theo tài khoản nếu có
    if (window.localStorage.getItem(LEGACY_STORAGE_KEY)) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    const key = getStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load wishlist from storage", err);
    return [];
  }
}

export function saveWishlist(ids, userId = null) {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch (err) {
    console.error("Failed to save wishlist to storage", err);
  }
}

export function clearWishlistStorage(userId = null) {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userId);
    window.localStorage.removeItem(key);
  } catch (err) {
    console.error("Failed to clear wishlist storage", err);
  }
}

// ==================== BACKEND DATABASE API SYNC ====================

export async function fetchWishlistApi() {
  try {
    return await fetchApi("/wishlist");
  } catch (err) {
    console.warn("fetchWishlistApi warning:", err.message);
    return null;
  }
}

export async function toggleItemApi(productId) {
  try {
    return await fetchApi("/wishlist/toggle", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  } catch (err) {
    console.warn("toggleItemApi warning:", err.message);
    return null;
  }
}

export async function addItemApi(productId) {
  try {
    return await fetchApi("/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  } catch (err) {
    console.warn("addItemApi warning:", err.message);
    return null;
  }
}

export async function removeItemApi(productId) {
  try {
    return await fetchApi(`/wishlist/items/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("removeItemApi warning:", err.message);
    return null;
  }
}

export async function clearWishlistApi() {
  try {
    return await fetchApi("/wishlist", {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("clearWishlistApi warning:", err.message);
    return null;
  }
}

export async function mergeWishlistApi(guestSessionId) {
  try {
    return await fetchApi("/wishlist/merge", {
      method: "POST",
      body: JSON.stringify({ guestSessionId }),
    });
  } catch (err) {
    console.warn("mergeWishlistApi warning:", err.message);
    return null;
  }
}
