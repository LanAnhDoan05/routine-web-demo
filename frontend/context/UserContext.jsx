"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import AuthPromptModal from "@/components/common/AuthPromptModal";

const USER_STORAGE_KEY = "routine_user_v1";

function getAddressStorageKey(userId) {
  return userId ? `routine_address_${userId}` : null;
}

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [savedAddress, setSavedAddressState] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Trạng thái modal yêu cầu đăng nhập
  const [authPrompt, setAuthPrompt] = useState({
    isOpen: false,
    title: "",
    message: "",
    redirectUrl: "/login",
  });

  // 1. Nạp user từ localStorage khi mount
  useEffect(() => {
    try {
      const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        setUser(parsedUser);
        if (parsedUser?.id) {
          const rawAddress = window.localStorage.getItem(getAddressStorageKey(parsedUser.id));
          if (rawAddress) setSavedAddressState(JSON.parse(rawAddress));
        }
      }
      // Dọn sạch key toàn cục cũ nếu có
      window.localStorage.removeItem("routine_saved_address_v1");
    } catch (err) {
      console.error("Failed to load user from storage", err);
    }
    setHydrated(true);
  }, []);

  // 2. Đồng bộ user vào localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (user) {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (err) {
      console.error("Failed to save user to storage", err);
    }
  }, [user, hydrated]);

  // 3. Khi user thay đổi (đổi tài khoản / đăng xuất): tự động nạp hoặc làm sạch địa chỉ
  useEffect(() => {
    if (!hydrated) return;
    if (!user || !user.id) {
      setSavedAddressState(null);
      return;
    }
    try {
      const key = getAddressStorageKey(user.id);
      const rawAddress = window.localStorage.getItem(key);
      if (rawAddress) {
        setSavedAddressState(JSON.parse(rawAddress));
      } else {
        setSavedAddressState(null);
      }
    } catch (err) {
      console.error("Failed to load address for user", err);
    }
  }, [user?.id, hydrated]);

  // 4. Lưu địa chỉ riêng biệt theo tài khoản đang đăng nhập
  const setSavedAddress = useCallback(
    (address) => {
      setSavedAddressState(address);
      if (typeof window !== "undefined" && user?.id) {
        try {
          const key = getAddressStorageKey(user.id);
          if (address) {
            window.localStorage.setItem(key, JSON.stringify(address));
          } else {
            window.localStorage.removeItem(key);
          }
        } catch (err) {
          console.error("Failed to save address for user", err);
        }
      }
    },
    [user?.id]
  );

  const login = useCallback((userData = "Khách hàng", stylePreference = "minimal", token = null) => {
    let finalUser = null;
    if (typeof userData === "string") {
      finalUser = {
        name: userData,
        role: "CUSTOMER",
        gender: "unisex",
        stylePreference,
      };
    } else if (userData && typeof userData === "object") {
      finalUser = {
        ...userData,
        name: userData.fullName || userData.name || "Khách hàng",
        role: userData.role || "CUSTOMER",
        gender: userData.gender || "unisex",
        stylePreference: userData.stylePreference || stylePreference || "minimal",
      };
    }
    setUser(finalUser);
    if (token && typeof window !== "undefined") {
      window.localStorage.setItem("routine_token", token);
    }
  }, []);

  const logout = useCallback(() => {
    const currentUserId = user?.id || null;
    setUser(null);
    setSavedAddressState(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("routine_token");
      window.localStorage.removeItem("token");
      window.localStorage.removeItem(USER_STORAGE_KEY);
      window.localStorage.removeItem("routine_saved_address_v1");
      window.localStorage.removeItem("routine_cart_v1");
      window.localStorage.removeItem("routine_cart_guest");
      window.localStorage.removeItem("routine_guest_session_id");
      window.sessionStorage.removeItem("routine_checkout_v1");
      if (currentUserId) {
        window.localStorage.removeItem(`routine_cart_user_${currentUserId}`);
      }
    }
  }, [user?.id]);

  const setStylePreference = useCallback((stylePreference) => {
    setUser((prev) => (prev ? { ...prev, stylePreference } : prev));
  }, []);

  // Mở modal yêu cầu đăng nhập ở giữa màn hình
  const openAuthPrompt = useCallback(({ title, message, redirectUrl = "/login" } = {}) => {
    setAuthPrompt({
      isOpen: true,
      title: title || "Đăng nhập để tiếp tục",
      message: message || "Vui lòng đăng nhập hoặc tạo tài khoản để thực hiện thao tác này.",
      redirectUrl,
    });
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setAuthPrompt((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Kiểm tra đăng nhập, nếu chưa đăng nhập thì tự động mở modal và trả về false
  const requireAuth = useCallback(
    ({ title, message, redirectUrl } = {}) => {
      if (user) return true;
      openAuthPrompt({ title, message, redirectUrl });
      return false;
    },
    [user, openAuthPrompt]
  );

  const value = useMemo(
    () => ({
      user,
      hydrated,
      isLoggedIn: Boolean(user),
      login,
      logout,
      setStylePreference,
      savedAddress,
      setSavedAddress,
      openAuthPrompt,
      closeAuthPrompt,
      requireAuth,
    }),
    [
      user,
      hydrated,
      login,
      logout,
      setStylePreference,
      savedAddress,
      setSavedAddress,
      openAuthPrompt,
      closeAuthPrompt,
      requireAuth,
    ]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
      <AuthPromptModal
        isOpen={authPrompt.isOpen}
        onClose={closeAuthPrompt}
        title={authPrompt.title}
        message={authPrompt.message}
        redirectUrl={authPrompt.redirectUrl}
      />
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
