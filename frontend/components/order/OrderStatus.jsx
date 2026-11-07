import { ORDER_STATUS_LABELS } from "@/lib/checkoutConstants";

const statusColors = {
  pending: "#8a8a8a",
  confirmed: "#111111",
  processing: "#b8860b",
  shipping: "#1f5fa8",
  delivered: "#2e7d32",
  cancelled: "#d93025"
};

export default function OrderStatus({ status }) {
  const label = ORDER_STATUS_LABELS[status] || status;
  const color = statusColors[status] || "#111111";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color }}>
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}
