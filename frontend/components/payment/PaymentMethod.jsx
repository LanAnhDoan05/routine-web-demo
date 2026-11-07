"use client";

import { PAYMENT_METHODS } from "@/lib/checkoutConstants";

export default function PaymentMethod({ value, onChange }) {
  return (
    <div className="payment-method-list" role="radiogroup" aria-label="Payment method">
      {PAYMENT_METHODS.map((method) => (
        <label key={method.id} className={`payment-method-option ${value === method.id ? "is-active" : ""}`}>
          <input
            type="radio"
            name="payment-method"
            value={method.id}
            checked={value === method.id}
            onChange={() => onChange(method.id)}
          />
          <span className="payment-method-info">
            <span style={{ fontWeight: 500 }}>{method.label}</span>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{method.description}</span>
          </span>
        </label>
      ))}

      <style>{`
        .payment-method-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .payment-method-option {
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .payment-method-option.is-active {
          border-color: var(--color-primary);
        }
        .payment-method-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      `}</style>
    </div>
  );
}
