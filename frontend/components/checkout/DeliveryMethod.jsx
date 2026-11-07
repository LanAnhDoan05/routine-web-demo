"use client";

import { useMemo, useEffect } from "react";
import { getShippingMethods } from "@/lib/checkoutConstants";
import { formatPrice } from "@/lib/format";
import { useCheckout } from "@/context/CheckoutContext";
import { useCart } from "@/context/CartContext";

export default function DeliveryMethod({ value, onChange, address: propAddress }) {
  const checkout = useCheckout();
  const { subtotal } = useCart();
  const currentAddress = propAddress !== undefined ? propAddress : checkout?.address;

  const methods = useMemo(() => {
    return Object.values(getShippingMethods(currentAddress, subtotal));
  }, [currentAddress, subtotal]);

  // Nếu phương thức hiện tại là Express nhưng địa chỉ > 30km (không khả dụng), tự động chuyển về Standard
  useEffect(() => {
    const expressMethod = methods.find((m) => m.id === "express");
    if (value === "express" && expressMethod && !expressMethod.available) {
      onChange("standard");
    }
  }, [methods, value, onChange]);

  return (
    <div className="delivery-method-list" role="radiogroup" aria-label="Phương thức giao hàng">
      {methods.map((method) => {
        const isSelected = value === method.id;
        const isDisabled = !method.available;
        const hasDiscount = method.discount && method.discount > 0;

        return (
          <label
            key={method.id}
            className={`delivery-method-option ${isSelected ? "is-active" : ""} ${
              isDisabled ? "is-disabled" : ""
            }`}
          >
            <input
              type="radio"
              name="delivery-method"
              value={method.id}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => !isDisabled && onChange(method.id)}
            />

            <span className="delivery-method-info">
              <span className="method-header">
                <span style={{ fontWeight: 600, fontSize: 14.5 }}>{method.label}</span>
                {method.provider && <span className="provider-badge">{method.provider}</span>}
                {method.isFree && <span className="free-badge">MIỄN PHÍ</span>}
              </span>

              <span className="method-sub">
                {method.eta}
                {method.distanceKm !== null && method.distanceKm !== undefined && (
                  <span style={{ marginLeft: 6 }}>
                    • Khoảng cách: <strong>{method.distanceKm} km</strong>
                  </span>
                )}
              </span>

              {/* Thông báo giảm giá ship Standard tự động */}
              {hasDiscount && (
                <span className="discount-tag">
                  ✓ {method.discountNote} (Đã trừ {formatPrice(method.discount)})
                </span>
              )}

              {/* Thông báo lý do Hỏa Tốc không khả dụng */}
              {isDisabled && method.reason && (
                <span className="warning-tag">
                  ⚠️ {method.reason}
                </span>
              )}
            </span>

            <span className="method-price">
              {hasDiscount && (
                <span className="original-price">{formatPrice(method.baseFee)}</span>
              )}
              <span className={`final-price ${method.isFree ? "price-free" : ""}`}>
                {method.isFree ? "Miễn phí" : formatPrice(method.fee)}
              </span>
            </span>
          </label>
        );
      })}

      <style>{`
        .delivery-method-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .delivery-method-option {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          cursor: pointer;
          background: #fff;
          transition: border-color var(--transition-fast), background 0.2s;
        }
        .delivery-method-option:hover:not(.is-disabled) {
          border-color: #94a3b8;
        }
        .delivery-method-option.is-active {
          border-color: var(--color-primary);
          background: #f8fafc;
        }
        .delivery-method-option.is-disabled {
          opacity: 0.65;
          cursor: not-allowed;
          background: #fafafa;
        }
        .delivery-method-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .method-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .provider-badge {
          font-size: 11px;
          font-weight: 600;
          color: #1e40af;
          background: #dbeafe;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .free-badge {
          font-size: 11px;
          font-weight: 700;
          color: #15803d;
          background: #dcfce7;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .method-sub {
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .discount-tag {
          font-size: 12.5px;
          font-weight: 600;
          color: #15803d;
          margin-top: 2px;
        }
        .warning-tag {
          font-size: 12.5px;
          color: #b45309;
          background: #fef3c7;
          padding: 4px 8px;
          border-radius: 4px;
          margin-top: 4px;
          display: inline-block;
        }
        .method-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          white-space: nowrap;
        }
        .original-price {
          font-size: 12.5px;
          color: #94a3b8;
          text-decoration: line-through;
        }
        .final-price {
          font-weight: 700;
          font-size: 15px;
          color: var(--color-text);
        }
        .final-price.price-free {
          color: #15803d;
        }
      `}</style>
    </div>
  );
}
