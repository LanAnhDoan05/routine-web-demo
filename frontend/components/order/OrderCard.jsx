import Link from "next/link";
import OrderStatus from "./OrderStatus";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrderCard({ order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="order-card">
      <div className="order-card-main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>ORDER #{order.id}</span>
          <OrderStatus status={order.status} />
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{formatDate(order.createdAt)}</p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          {itemCount} {itemCount === 1 ? "item" : "items"} · {formatPrice(order.total)}
        </p>
      </div>
      <Link href={`/orders/${order.id}`} className="btn btn-secondary btn-sm">
        View Order
      </Link>

      <style>{`
        .order-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 1px solid var(--color-border);
        }
        @media (max-width: 640px) {
          .order-card {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
