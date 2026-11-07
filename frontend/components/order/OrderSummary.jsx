import { formatPrice } from "@/lib/format";

export default function OrderSummary({ order }) {
  return (
    <div className="order-summary">
      <h2 style={{ fontSize: 16, marginBottom: 20, letterSpacing: "0.04em" }}>ORDER SUMMARY</h2>

      <div className="order-summary-row">
        <span>Subtotal</span>
        <span>{formatPrice(order.subtotal)}</span>
      </div>
      <div className="order-summary-row">
        <span>Shipping</span>
        <span>{formatPrice(order.shipping)}</span>
      </div>
      {order.discount > 0 && (
        <div className="order-summary-row" style={{ color: "var(--color-success)" }}>
          <span>Discount</span>
          <span>-{formatPrice(order.discount)}</span>
        </div>
      )}
      <div className="order-summary-row order-summary-total">
        <span>TOTAL</span>
        <span>{formatPrice(order.total)}</span>
      </div>

      <style>{`
        .order-summary {
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          padding: 24px;
        }
        .order-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        .order-summary-total {
          border-top: 1px solid var(--color-border);
          margin-top: 8px;
          padding-top: 16px;
          font-weight: 600;
          font-size: 16px;
          color: var(--color-text);
        }
      `}</style>
    </div>
  );
}
