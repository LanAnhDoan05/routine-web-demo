"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  loadWishlist,
  saveWishlist,
  fetchWishlistApi,
  toggleItemApi,
  addItemApi,
  removeItemApi,
  clearWishlistApi,
} from "@/lib/wishlistService";
import { useUser } from "@/context/UserContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const [productIds, setProductIds] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUserIdRef = useRef(user?.id || null);

  // Khi người dùng đăng nhập, đăng xuất hoặc đổi tài khoản:
  useEffect(() => {
    let isCurrent = true;
    const userId = user?.id || null;
    currentUserIdRef.current = userId;

    if (!isLoggedIn || !userId) {
      // Khi chưa đăng nhập hoặc vừa đăng xuất: Đặt danh sách yêu thích về rỗng ngay lập tức
      setProductIds([]);
      setItems([]);
      setLoading(false);
      return;
    }

    // Đã đăng nhập: Nạp trước dữ liệu đệm của chính tài khoản này (nếu có)
    const cached = loadWishlist(userId);
    setProductIds(cached);
    setLoading(true);

    // Đồng bộ chính xác danh sách yêu thích thực tế từ MySQL Database theo tài khoản
    fetchWishlistApi()
      .then((remoteWishlist) => {
        if (!isCurrent) return;
        if (remoteWishlist && Array.isArray(remoteWishlist.productIds)) {
          // Lấy đúng danh sách thực tế của tài khoản từ Database
          setProductIds(remoteWishlist.productIds);
          if (Array.isArray(remoteWishlist.items)) {
            setItems(remoteWishlist.items);
          }
          saveWishlist(remoteWishlist.productIds, userId);
        }
      })
      .catch((err) => {
        console.warn("Lỗi đồng bộ danh sách yêu thích với Database:", err.message);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isLoggedIn, user?.id]);

  // Luôn cập nhật cache lưu trữ riêng biệt ứng với tài khoản đang đăng nhập
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      saveWishlist(productIds, user.id);
    }
  }, [productIds, isLoggedIn, user?.id]);

  const isInWishlist = useCallback((id) => productIds.includes(id), [productIds]);

  const addToWishlist = useCallback(
    (id) => {
      if (!isLoggedIn || !user?.id) return;
      setProductIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      addItemApi(id)
        .then((res) => {
          if (res && Array.isArray(res.productIds)) {
            setProductIds(res.productIds);
            if (Array.isArray(res.items)) setItems(res.items);
          }
        })
        .catch((e) => console.warn("Lỗi lưu wishlist DB:", e.message));
    },
    [isLoggedIn, user?.id]
  );

  const removeFromWishlist = useCallback(
    (id) => {
      if (!isLoggedIn || !user?.id) return;
      setProductIds((prev) => prev.filter((pid) => pid !== id));
      setItems((prev) => prev.filter((item) => item.id !== id));
      removeItemApi(id)
        .then((res) => {
          if (res && Array.isArray(res.productIds)) {
            setProductIds(res.productIds);
            if (Array.isArray(res.items)) setItems(res.items);
          }
        })
        .catch((e) => console.warn("Lỗi xóa wishlist DB:", e.message));
    },
    [isLoggedIn, user?.id]
  );

  const toggleWishlist = useCallback(
    (id) => {
      if (!isLoggedIn || !user?.id) return;
      setProductIds((prev) =>
        prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
      );
      toggleItemApi(id)
        .then((res) => {
          if (res && Array.isArray(res.productIds)) {
            setProductIds(res.productIds);
            if (Array.isArray(res.items)) setItems(res.items);
          }
        })
        .catch((e) => console.warn("Lỗi toggle wishlist DB:", e.message));
    },
    [isLoggedIn, user?.id]
  );

  const clearWishlist = useCallback(() => {
    if (!isLoggedIn || !user?.id) return;
    setProductIds([]);
    setItems([]);
    saveWishlist([], user.id);
    clearWishlistApi().catch((e) => console.warn("Lỗi dọn wishlist DB:", e.message));
  }, [isLoggedIn, user?.id]);

  const value = useMemo(
    () => ({
      items,
      productIds,
      count: isLoggedIn ? productIds.length : 0,
      loading,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [
      items,
      productIds,
      isLoggedIn,
      loading,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    ]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
