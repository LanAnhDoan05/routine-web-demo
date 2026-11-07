const steps = [
  { id: "cart", number: "01", label: "Cart" },
  { id: "checkout", number: "02", label: "Checkout" },
  { id: "payment", number: "03", label: "Payment" },
  { id: "complete", number: "04", label: "Complete" }
];

export default function CheckoutHeader({ activeStep }) {
  const activeIndex = steps.findIndex((s) => s.id === activeStep);

  return (
    <div className="checkout-progress" role="list" aria-label="Checkout progress">
      {steps.map((step, idx) => {
        const state = idx < activeIndex ? "done" : idx === activeIndex ? "active" : "upcoming";
        return (
          <div className="checkout-progress-step" key={step.id} role="listitem" aria-current={state === "active" ? "step" : undefined}>
            <span className={`checkout-progress-badge checkout-progress-badge--${state}`}>
              {state === "done" ? "✓" : step.number}
            </span>
            <span className={`checkout-progress-label checkout-progress-label--${state}`}>{step.label}</span>
            {idx < steps.length - 1 && <span className="checkout-progress-connector" aria-hidden="true" />}
          </div>
        );
      })}

      <style>{`
        .checkout-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .checkout-progress-step {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .checkout-progress-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          background: var(--color-bg);
        }
        .checkout-progress-badge--active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #fff;
        }
        .checkout-progress-badge--done {
          background: var(--color-text);
          border-color: var(--color-text);
          color: #fff;
        }
        .checkout-progress-label {
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .checkout-progress-label--active {
          color: var(--color-text);
          font-weight: 600;
        }
        .checkout-progress-connector {
          width: 24px;
          height: 1px;
          background: var(--color-border);
          margin: 0 4px;
        }
        @media (max-width: 640px) {
          .checkout-progress-label { display: none; }
          .checkout-progress-connector { width: 16px; }
        }
      `}</style>
    </div>
  );
}
