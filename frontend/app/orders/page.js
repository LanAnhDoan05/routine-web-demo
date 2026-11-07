"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OrderCard from "@/components/order/OrderCard";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import { useOrders } from "@/context/OrderContext";
import { useUser } from "@/context/UserContext";
import { ORDER_FILTERS } from "@/lib/checkoutConstants";

export default function OrdersPage() {
  const router = useRouter();
  const { orders, hydrated, loading, refreshOrders } = useOrders();
  const { isLoggedIn, logout } = useUser();
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const filteredOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filter
      ? sorted.filter((o) => {
          const s = (o.status || o.orderStatus || "").toLowerCase();
          if (filter === "processing") {
            return s === "processing" || s === "confirmed" || s === "pending";
          }
          return s === filter;
        })
      : sorted;
  }, [orders, filter]);

  if (!hydrated && loading) {
    return (
      <div className="container section" style={{ textAlign: "center", padding: "80px 0" }}>
        <Loading />
        <p style={{ marginTop: 16, color: "var(--color-text-secondary)" }}>
          Đang tải lịch sử đơn hàng...
        </p>
      </div>
    );
  }

  return (
    <div className="container section">
      <nav className="breadcrumb" style={{ marginBottom: 20 }} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="breadcrumb-current">Orders</span>
      </nav>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="section-title" style={{ margin: 0 }}>
          MY ORDERS
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => refreshOrders()}
            title="Làm mới danh sách"
          >
            ↻ Làm mới
          </button>
          {isLoggedIn && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="NO ORDERS YET"
          description="Bạn chưa có đơn hàng nào. Khám phá bộ sưu tập mới và tìm outfit phù hợp với bạn."
          action={
            <Link href="/" className="btn btn-primary">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {ORDER_FILTERS.map((f) => (
              <button
                key={f.label}
                className={`chip ${filter === f.value ? "is-active" : ""}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <EmptyState title="Không có đơn hàng phù hợp" description="Hãy thử bộ lọc khác." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
