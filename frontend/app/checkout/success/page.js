"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import { useOrders } from "@/context/OrderContext";

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="container section" />}>
      <OrderSuccessInner />
    </Suspense>
  );
}

function OrderSuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const email = searchParams.get("email");
  const { getOrderById, fetchOrder, hydrated } = useOrders();
  const [order, setOrder] = useState(() => (orderId ? getOrderById(orderId) : null));
  const [loading, setLoading] = useState(!order && Boolean(orderId));

  useEffect(() => {
    let active = true;
    if (orderId) {
      fetchOrder(orderId).then((data) => {
        if (active) {
          if (data) setOrder(data);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [orderId, fetchOrder]);

  if (!hydrated || loading) {
    return (
      <div className="container section" style={{ textAlign: "center", padding: "80px 0" }}>
        <Loading />
        <p style={{ marginTop: 16, color: "var(--color-text-secondary)" }}>
          Đang xác nhận thông tin đơn hàng...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container section">
        <EmptyState
          title="ORDER NOT FOUND"
          description="Không tìm thấy đơn hàng."
          action={
            <Link href="/orders" className="btn btn-primary">
              Back to Orders
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container section">
      <CheckoutHeader activeStep="complete" />

      <div className="order-success">
        <div className="order-success-check" aria-hidden="true">
          ✓
        </div>
        <h1 className="section-title" style={{ marginBottom: 8 }}>
          ORDER CONFIRMED
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 4 }}>
          Cảm ơn bạn đã mua sắm cùng Routine.
        </p>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 20 }}>
          Đơn hàng của bạn đã được tiếp nhận.
        </p>

        <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>ORDER #{order.id}</p>

        {email && (
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 32 }}>
            Email xác nhận sẽ được gửi tới: <strong>{email}</strong>
          </p>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
          <Link href={`/orders/${order.id}`} className="btn btn-primary">
            View Order
          </Link>
          <Link href="/" className="btn btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>

      <style>{`
        .order-success {
          max-width: 480px;
          margin: 0 auto;
          text-align: center;
          padding: 40px 0 64px;
        }
        .order-success-check {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--color-success);
          color: #fff;
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
      `}</style>
    </div>
  );
}
