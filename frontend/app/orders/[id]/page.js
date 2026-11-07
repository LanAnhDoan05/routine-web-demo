"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import OrderTimeline from "@/components/order/OrderTimeline";
import OrderItems from "@/components/order/OrderItems";
import OrderSummary from "@/components/order/OrderSummary";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import Modal from "@/components/common/Modal";
import { useOrders } from "@/context/OrderContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/common/Toast";
import { formatDate } from "@/lib/format";
import { SHIPPING_METHODS, PAYMENT_METHOD_LABELS, canCancelOrder } from "@/lib/checkoutConstants";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hydrated, getOrderById, fetchOrder, cancelOrder } = useOrders();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [order, setOrder] = useState(() => getOrderById(params.id));
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    let active = true;
    if (params.id) {
      fetchOrder(params.id).then((data) => {
        if (active && data) {
          setOrder(data);
          setLoading(false);
        } else if (active) {
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [params.id, fetchOrder]);

  if (!hydrated || loading) {
    return (
      <div className="container section" style={{ textAlign: "center", padding: "80px 0" }}>
        <Loading />
        <p style={{ marginTop: 16, color: "var(--color-text-secondary)" }}>
          Đang tải thông tin chi tiết đơn hàng...
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

  const delivery = SHIPPING_METHODS[order.shippingMethod];

  function handleConfirmCancel() {
    cancelOrder(order.id);
    setCancelModalOpen(false);
    showToast("Đơn hàng đã được huỷ.");
  }

  function handleBuyAgain() {
    let addedCount = 0;
    order.items.forEach((item) => {
      const product = {
        id: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        images: item.image ? [item.image] : [],
        sizes: item.size ? [item.size] : [],
        colors: item.color ? [item.color] : []
      };
      addToCart(product, { size: item.size, color: item.color, quantity: item.quantity });
      addedCount += 1;
    });
    if (addedCount === 0) {
      showToast("Sản phẩm trong đơn hàng này hiện không còn khả dụng.");
      return;
    }
    showToast("Đã thêm sản phẩm vào giỏ hàng.");
    router.push("/cart");
  }

  function handleWriteReview() {
    const firstProductId = order.items?.[0]?.productId;
    if (firstProductId) {
      router.push(`/product/${firstProductId}#reviews`);
    } else {
      showToast("Không tìm thấy thông tin sản phẩm để đánh giá.", "error");
    }
  }

  return (
    <div className="container section">
      <nav className="breadcrumb" style={{ marginBottom: 20 }} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/orders">Orders</Link>
        <span>/</span>
        <span className="breadcrumb-current">{order.id}</span>
      </nav>

      <h1 className="section-title" style={{ marginBottom: 4 }}>
        ORDER DETAIL
      </h1>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 32 }}>
        Order #{order.id} · Placed on {formatDate(order.createdAt)}
      </p>

      <div className="order-detail-layout">
        <div>
          <section className="order-detail-section">
            <h2 className="order-detail-section-title">Order Status</h2>
            <OrderTimeline status={order.status} />
          </section>

          <section className="order-detail-section">
            <h2 className="order-detail-section-title">Items</h2>
            <OrderItems items={order.items} />
          </section>

          <section className="order-detail-section">
            <h2 className="order-detail-section-title">Shipping Address</h2>
            <p style={{ fontWeight: 500 }}>{order.shippingAddress?.name}</p>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>{order.shippingAddress?.phone}</p>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginTop: 6, lineHeight: 1.6 }}>
              {order.shippingAddress?.address}
              <br />
              {order.shippingAddress?.ward && <>{order.shippingAddress.ward}, </>}
              {order.shippingAddress?.district}
              <br />
              {order.shippingAddress?.city}
            </p>
          </section>

          <section className="order-detail-section">
            <h2 className="order-detail-section-title">Delivery</h2>
            <p style={{ fontWeight: 500 }}>{delivery?.label || order.shippingMethod}</p>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>{delivery?.eta}</p>
          </section>

          <section className="order-detail-section">
            <h2 className="order-detail-section-title">Payment</h2>
            <p style={{ fontWeight: 500 }}>{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</p>
          </section>

          <section className="order-detail-section" style={{ borderBottom: "none" }}>
            <h2 className="order-detail-section-title">Actions</h2>
            {order.status === "cancelled" && (
              <p style={{ color: "var(--color-error)", fontWeight: 600 }}>ORDER CANCELLED</p>
            )}
            {canCancelOrder(order.status) && (
              <button className="btn btn-secondary" onClick={() => setCancelModalOpen(true)}>
                Cancel Order
              </button>
            )}
            {order.status === "delivered" && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={handleBuyAgain}>
                  Buy Again
                </button>
                <button className="btn btn-secondary" onClick={handleWriteReview}>
                  Write Review
                </button>
              </div>
            )}
          </section>
        </div>

        <div>
          <OrderSummary order={order} />
        </div>
      </div>

      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Order">
        <p style={{ marginBottom: 20, color: "var(--color-text-secondary)" }}>
          Bạn có chắc chắn muốn huỷ đơn hàng #{order.id}? Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCancelModalOpen(false)}>
            Giữ đơn hàng
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirmCancel}>
            Huỷ đơn hàng
          </button>
        </div>
      </Modal>

      <style>{`
        .order-detail-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 48px;
          align-items: start;
        }
        .order-detail-section {
          padding-bottom: 28px;
          margin-bottom: 28px;
          border-bottom: 1px solid var(--color-border);
        }
        .order-detail-section-title {
          font-size: 15px;
          letter-spacing: 0.04em;
          margin-bottom: 14px;
        }
        @media (max-width: 1023px) {
          .order-detail-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
