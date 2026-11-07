import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, getOrderStatusStepIndex } from "@/lib/checkoutConstants";

export default function OrderTimeline({ status }) {
  if (status === "cancelled") {
    return (
      <div className="order-timeline order-timeline--cancelled" role="status">
        <span aria-hidden="true">✕</span> ORDER CANCELLED
      </div>
    );
  }

  const activeIndex = getOrderStatusStepIndex(status);
  // Skip "pending" in the visual timeline — orders in this mock flow
  // are created directly as "confirmed", but the flow still supports
  // pending for orders that might arrive that way later.
  const steps = ORDER_STATUS_FLOW.filter((s) => s !== "pending" || activeIndex === 0);

  return (
    <ol className="order-timeline" aria-label="Order status timeline">
      {steps.map((step) => {
        const stepIndex = getOrderStatusStepIndex(step);
        const state = stepIndex < activeIndex ? "done" : stepIndex === activeIndex ? "active" : "upcoming";
        return (
          <li key={step} className={`order-timeline-step order-timeline-step--${state}`}>
            <span className="order-timeline-marker" aria-hidden="true">
              {state === "upcoming" ? "○" : "●"}
            </span>
            <span>{ORDER_STATUS_LABELS[step]}</span>
          </li>
        );
      })}

      <style>{`
        .order-timeline {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .order-timeline-step {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          font-size: 14px;
          color: var(--color-text-secondary);
          position: relative;
        }
        .order-timeline-step:not(:last-child)::before {
          content: "";
          position: absolute;
          left: 6px;
          top: 26px;
          width: 1px;
          height: 16px;
          background: var(--color-border);
        }
        .order-timeline-step--done,
        .order-timeline-step--active {
          color: var(--color-text);
          font-weight: 500;
        }
        .order-timeline-marker {
          font-size: 12px;
          width: 14px;
          text-align: center;
        }
        .order-timeline--cancelled {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--color-error);
          font-weight: 600;
          font-size: 14px;
        }
      `}</style>
    </ol>
  );
}
