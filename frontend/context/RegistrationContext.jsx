"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "routine_registration_data";

const RegistrationContext = createContext(null);

const emptyData = {
  name: "",
  gender: "men",
  dateOfBirth: "",
  date: "",
  phone: "",
  email: "",
  password: "",
  selectedStyles: [],
};

/**
 * Lưu tạm dữ liệu đăng ký (họ tên, giới tính, ngày sinh, sđt, email, mật khẩu, phong cách đã chọn)
 * xuyên suốt /register → /register/style.
 *
 * Dùng React Context + sessionStorage: dữ liệu chỉ tồn tại trong phiên
 * đăng ký hiện tại và bị xóa ngay sau khi đăng ký thành công hoặc khi tab
 * bị đóng. Mật khẩu KHÔNG bao giờ được ghi vào localStorage.
 */
export function RegistrationProvider({ children }) {
  const [data, setData] = useState(emptyData);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate từ sessionStorage sau khi mount (chỉ chạy ở client).
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData({ ...emptyData, ...JSON.parse(raw) });
      }
    } catch {
      // sessionStorage không khả dụng (ví dụ: chế độ duyệt web riêng tư).
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const persist = useCallback((next) => {
    setData(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Bỏ qua nếu không ghi được — trải nghiệm vẫn hoạt động trong bộ nhớ.
    }
  }, []);

  const saveAccountInfo = useCallback(
    ({ name, gender, dateOfBirth, date, phone, email, password }) => {
      const dob = dateOfBirth || date || "";
      persist({
        ...data,
        name,
        gender: gender || "men",
        dateOfBirth: dob,
        date: dob,
        phone,
        email,
        password,
      });
    },
    [data, persist]
  );

  const saveSelectedStyles = useCallback(
    (selectedStyles) => {
      persist({ ...data, selectedStyles });
    },
    [data, persist]
  );

  const clearRegistrationData = useCallback(() => {
    setData(emptyData);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  }, []);

  return (
    <RegistrationContext.Provider
      value={{
        data,
        isHydrated,
        saveAccountInfo,
        saveSelectedStyles,
        clearRegistrationData,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error("useRegistration phải được dùng bên trong RegistrationProvider.");
  }
  return ctx;
}
