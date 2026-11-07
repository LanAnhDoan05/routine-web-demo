"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import * as orderService from "@/lib/orderService";
import { useUser } from "@/context/UserContext";

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const items = await orderService.fetchOrders();
      if (Array.isArray(items)) {
        setOrders(items);
      }
    } catch (err) {
      console.error("[OrderContext] Failed to fetch orders from backend:", err);
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders, user]);

  const createOrder = useCallback(async (orderInput) => {
    const newOrder = await orderService.createOrder(orderInput);
    if (newOrder && newOrder.id) {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    }
    return newOrder;
  }, []);

  const cancelOrder = useCallback(async (id) => {
    const updated = await orderService.cancelOrder(id);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
    return updated;
  }, []);

  const getOrderById = useCallback(
    (id) => orders.find((o) => o.id === id) || null,
    [orders]
  );

  const fetchOrder = useCallback(
    async (id) => {
      const existing = orders.find((o) => o.id === id);
      if (existing) return existing;
      const fetched = await orderService.fetchOrderById(id);
      if (fetched && fetched.id) {
        setOrders((prev) => [fetched, ...prev.filter((o) => o.id !== id)]);
      }
      return fetched;
    },
    [orders]
  );

  const value = useMemo(
    () => ({
      orders,
      hydrated,
      loading,
      createOrder,
      cancelOrder,
      getOrderById,
      fetchOrder,
      refreshOrders,
    }),
    [orders, hydrated, loading, createOrder, cancelOrder, getOrderById, fetchOrder, refreshOrders]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within an OrderProvider");
  return ctx;
}
