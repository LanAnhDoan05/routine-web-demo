"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { DEFAULT_SHIPPING_METHOD } from "@/lib/checkoutConstants";
import { useUser } from "@/context/UserContext";

const STORAGE_KEY = "routine_checkout_v1";

const defaultState = {
  contact: { phone: "", email: "" },
  address: null,
  note: "",
  shippingMethod: DEFAULT_SHIPPING_METHOD,
  voucherCode: "",
  discount: 0
};

const CheckoutContext = createContext(null);

export function CheckoutProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useUser();
  const prevUserIdRef = useRef(user?.id || null);

  const reset = useCallback(() => {
    setState(defaultState);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  // Tự động làm sạch form thanh toán khi người dùng đổi tài khoản hoặc đăng xuất
  useEffect(() => {
    const currentUserId = user?.id || null;
    if (prevUserIdRef.current !== currentUserId) {
      reset();
      prevUserIdRef.current = currentUserId;
    }
  }, [user?.id, reset]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch (err) {
      console.error("Failed to load checkout state from storage", err);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to save checkout state to storage", err);
    }
  }, [state, hydrated]);

  const setContact = useCallback((contact) => {
    setState((prev) => ({ ...prev, contact: { ...prev.contact, ...contact } }));
  }, []);

  const setAddress = useCallback((address) => {
    setState((prev) => ({ ...prev, address }));
  }, []);

  const setNote = useCallback((note) => {
    setState((prev) => ({ ...prev, note }));
  }, []);

  const setShippingMethod = useCallback((shippingMethod) => {
    setState((prev) => ({ ...prev, shippingMethod }));
  }, []);

  const applyVoucher = useCallback((voucherCode, discount) => {
    setState((prev) => ({ ...prev, voucherCode, discount }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      setContact,
      setAddress,
      setNote,
      setShippingMethod,
      applyVoucher,
      reset
    }),
    [state, hydrated, setContact, setAddress, setNote, setShippingMethod, applyVoucher, reset]
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used within a CheckoutProvider");
  return ctx;
}
