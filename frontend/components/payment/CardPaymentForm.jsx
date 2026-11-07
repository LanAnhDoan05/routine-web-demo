"use client";

// Pure UI demo — no real card processing. These values are held only
// in this form's local React state for the duration of the page and
// are never written to localStorage/sessionStorage or included in
// the order object that gets persisted.

function formatCardNumber(value) {
  return value
    .replace(/[^\d]/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value) {
  const digits = value.replace(/[^\d]/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export default function CardPaymentForm({ values, onChange }) {
  function update(field, raw) {
    let next = raw;
    if (field === "cardNumber") next = formatCardNumber(raw);
    if (field === "expiry") next = formatExpiry(raw);
    if (field === "cvv") next = raw.replace(/[^\d]/g, "").slice(0, 4);
    onChange({ ...values, [field]: next });
  }

  return (
    <div className="card-form">
      <div className="field card-form-full">
        <label htmlFor="card-number">Card Number</label>
        <input
          id="card-number"
          className="input"
          inputMode="numeric"
          autoComplete="off"
          placeholder="1234 5678 9012 3456"
          value={values.cardNumber || ""}
          onChange={(e) => update("cardNumber", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="card-expiry">MM / YY</label>
        <input
          id="card-expiry"
          className="input"
          inputMode="numeric"
          autoComplete="off"
          placeholder="MM / YY"
          value={values.expiry || ""}
          onChange={(e) => update("expiry", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="card-cvv">CVV</label>
        <input
          id="card-cvv"
          className="input"
          inputMode="numeric"
          autoComplete="off"
          type="password"
          placeholder="•••"
          value={values.cvv || ""}
          onChange={(e) => update("cvv", e.target.value)}
        />
      </div>

      <div className="field card-form-full">
        <label htmlFor="card-holder">Card Holder Name</label>
        <input
          id="card-holder"
          className="input"
          autoComplete="off"
          placeholder="NGUYEN VAN A"
          value={values.cardHolder || ""}
          onChange={(e) => update("cardHolder", e.target.value.toUpperCase())}
        />
      </div>

      <style>{`
        .card-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }
        .card-form-full { grid-column: span 2; }
        @media (max-width: 640px) {
          .card-form { grid-template-columns: 1fr; }
          .card-form-full { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
}
