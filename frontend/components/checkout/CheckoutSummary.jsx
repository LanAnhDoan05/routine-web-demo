"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/format";
import { getShippingFee, calculateStandardShipping } from "@/lib/checkoutConstants";
import { useCheckout } from "@/context/CheckoutContext";
import { useToast } from "@/components/common/Toast";
import { validateCouponApi } from "@/lib/couponService";
import { applyCouponApi, removeCouponApi } from "@/lib/cartService";

export default function CheckoutSummary({
  subtotal,
  shippingMethod,
  discount: propDiscount,
  onContinue,
  ctaLabel = "Continue to Payment",
  disabled = false
}) {
  const { voucherCode, discount: ctxDiscount, applyVoucher, address } = useCheckout();
  const currentDiscount = ctxDiscount !== undefined ? ctxDiscount : (propDiscount || 0);

  const [inputCode, setInputCode] = useState(voucherCode || "");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (voucherCode) {
      setInputCode(voucherCode);
    }
  }, [voucherCode]);

  const shipping = subtotal === 0 ? 0 : getShippingFee(shippingMethod, address, subtotal);
  const stdInfo = calculateStandardShipping(subtotal);
  const isStandard = String(shippingMethod || "standard").toLowerCase() === "standard";
  const hasShippingDiscount = isStandard && stdInfo.discount > 0;
  const total = Math.max(subtotal + shipping - currentDiscount, 0);

  async function handleApplyVoucher(e) {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      showToast("Vui lòng nhập mã giảm giá.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await validateCouponApi(cleanCode, subtotal);
      if (res && res.valid) {
        applyVoucher(res.code, res.discountAmount);
        try {
          await applyCouponApi(res.code);
        } catch {
          // ignore
        }
        showToast(res.description ? `Áp dụng "${res.code}": ${res.description}` : `Áp dụng mã "${res.code}" thành công.`);
      } else {
        showToast(res?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      }
    } catch (err) {
      showToast(err.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveVoucher() {
    applyVoucher("", 0);
    setInputCode("");
    try {
      await removeCouponApi();
    } catch {
      // ignore
    }
    showToast("Đã hủy áp dụng mã giảm giá.");
  }

  return (
    <div className="checkout-summary">
      <h2 style={{ fontSize: 16, marginBottom: 20, letterSpacing: "0.04em" }}>ORDER SUMMARY</h2>

      {voucherCode && currentDiscount > 0 ? (
        <div className="applied-coupon-box">
          <div className="applied-coupon-info">
            <span className="applied-coupon-tag">🏷️ {voucherCode}</span>
            <span className="applied-coupon-desc">Đã giảm {formatPrice(currentDiscount)}</span>
          </div>
          <button type="button" className="applied-coupon-remove" onClick={handleRemoveVoucher} title="Hủy mã">
            ✕ Gỡ
          </button>
        </div>
      ) : (
        <form onSubmit={handleApplyVoucher} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            className="input"
            style={{ flex: 1, textTransform: "uppercase" }}
            placeholder="Mã giảm giá (Voucher)"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            disabled={isLoading}
            aria-label="Mã giảm giá"
          />
          <button type="submit" className="btn btn-secondary btn-sm" disabled={isLoading || !inputCode.trim()}>
            {isLoading ? "..." : "Áp dụng"}
          </button>
        </form>
      )}

      <div className="checkout-summary-row">
        <span>Tạm tính (Subtotal)</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="checkout-summary-row">
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
        <div className="checkout-summary-row" style={{ color: "var(--color-success)", fontSize: 13 }}>
          <span>{stdInfo.discountNote}</span>
          <span>-{formatPrice(stdInfo.discount)}</span>
        </div>
      )}
      {currentDiscount > 0 && (
        <div className="checkout-summary-row" style={{ color: "var(--color-success)" }}>
          <span>Giảm giá ({voucherCode || "Voucher"})</span>
          <span>-{formatPrice(currentDiscount)}</span>
        </div>
      )}

      <div className="checkout-summary-row checkout-summary-total">
        <span>TỔNG CỘNG</span>
        <span>{formatPrice(total)}</span>
      </div>

      {onContinue && (
        <button className="btn btn-primary btn-full" style={{ marginTop: 20 }} onClick={onContinue} disabled={disabled}>
          {ctaLabel}
        </button>
      )}

      <style>{`
        .checkout-summary {
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          padding: 24px;
          position: sticky;
          top: calc(var(--header-height) + 24px);
        }
        .applied-coupon-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(46, 125, 50, 0.08);
          border: 1px dashed var(--color-success, #2e7d32);
          border-radius: var(--radius-sm, 6px);
          padding: 10px 14px;
          margin-bottom: 20px;
        }
        .applied-coupon-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .applied-coupon-tag {
          font-weight: 700;
          font-size: 13px;
          color: var(--color-success, #2e7d32);
          letter-spacing: 0.05em;
        }
        .applied-coupon-desc {
          font-size: 12px;
          color: var(--color-text-secondary);
        }
        .applied-coupon-remove {
          background: transparent;
          border: none;
          color: var(--color-text-muted, #888);
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .applied-coupon-remove:hover {
          color: var(--color-error, #d93025);
          background: rgba(217, 48, 37, 0.08);
        }
        .checkout-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        .checkout-summary-total {
          border-top: 1px solid var(--color-border);
          margin-top: 8px;
          padding-top: 16px;
          font-weight: 600;
          font-size: 16px;
          color: var(--color-text);
        }
        @media (max-width: 1023px) {
          .checkout-summary { position: static; }
        }
      `}</style>
    </div>
  );
}
