"use client";

import { formatPrice } from "@/lib/format";
import { getShippingFee, calculateStandardShipping } from "@/lib/checkoutConstants";
import { useCheckout } from "@/context/CheckoutContext";

export default function PaymentSummary({
  subtotal,
  shippingMethod,
  discount = 0,
  voucherCode = "",
  onPlaceOrder,
  isProcessing,
  error,
  address: propAddress,
}) {
  const checkout = useCheckout();
  const address = propAddress !== undefined ? propAddress : checkout?.address;
  const shipping = getShippingFee(shippingMethod, address, subtotal);
  const stdInfo = calculateStandardShipping(subtotal);
  const isStandard = String(shippingMethod || "standard").toLowerCase() === "standard";
  const hasShippingDiscount = isStandard && stdInfo.discount > 0;
  const total = Math.max(subtotal + shipping - discount, 0);

  return (
    <div className="payment-summary">
      <h2 style={{ fontSize: 16, marginBottom: 20, letterSpacing: "0.04em" }}>TỔNG QUAN ĐƠN HÀNG</h2>

      <div className="payment-summary-row">
        <span>Tạm tính (Subtotal)</span>
        <span>{formatPrice(subtotal)}</span>
      </div>

      <div className="payment-summary-row">
        <span>Phí vận chuyển</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hasShippingDiscount && (
            <span style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>
              {formatPrice(stdInfo.baseFee)}
            </span>
          )}
          <span style={{ fontWeight: 600 }}>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</span>
        </span>
      </div>

      {hasShippingDiscount && (
        <div className="payment-summary-row" style={{ color: "var(--color-success)", fontSize: 13 }}>
          <span>{stdInfo.discountNote}</span>
          <span>-{formatPrice(stdInfo.discount)}</span>
        </div>
      )}

      {discount > 0 && (
        <div className="payment-summary-row" style={{ color: "var(--color-success)" }}>
          <span>Giảm giá {voucherCode ? `(${voucherCode})` : ""}</span>
          <span>-{formatPrice(discount)}</span>
        </div>
      )}

      <div className="payment-summary-row payment-summary-total">
        <span>TỔNG THANH TOÁN</span>
        <span>{formatPrice(total)}</span>
      </div>

      {error && (
        <div className="payment-error" role="alert">
          <p style={{ fontWeight: 600, marginBottom: 4 }}>THANH TOÁN THẤT BẠI</p>
          <p style={{ fontSize: 13 }}>{error}</p>
        </div>
      )}

      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: 20 }}
        onClick={onPlaceOrder}
        disabled={isProcessing}
      >
        {isProcessing ? "Đang xử lý..." : error ? "Thử lại" : "Đặt hàng"}
      </button>

      <style>{`
        .payment-summary {
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          padding: 24px;
          position: sticky;
          top: calc(var(--header-height) + 24px);
        }
        .payment-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        .payment-summary-total {
          border-top: 1px solid var(--color-border);
          margin-top: 8px;
          padding-top: 16px;
          font-weight: 600;
          font-size: 16px;
          color: var(--color-text);
        }
        .payment-error {
          margin-top: 16px;
          padding: 14px;
          border-radius: var(--radius-sm);
          background: rgba(217, 48, 37, 0.08);
          color: var(--color-error);
        }
        @media (max-width: 1023px) {
          .payment-summary { position: static; }
        }
      `}</style>
    </div>
  );
}
