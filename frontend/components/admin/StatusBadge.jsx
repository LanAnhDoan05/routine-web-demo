import styles from "./StatusBadge.module.css";

const STATUS_MAP = {
  ACTIVE: { label: "Active", tone: "success" },
  DRAFT: { label: "Draft", tone: "neutral" },
  INACTIVE: { label: "Inactive", tone: "muted" },
  IN_STOCK: { label: "In Stock", tone: "success" },
  LOW_STOCK: { label: "Low Stock", tone: "warning" },
  OUT_OF_STOCK: { label: "Out of Stock", tone: "danger" },
  NEW: { label: "New", tone: "info" },
  BEST_SELLER: { label: "Best Seller", tone: "primary" },
  SALE: { label: "Sale", tone: "danger" },
  LIMITED: { label: "Limited", tone: "warning" },
  NONE: { label: "—", tone: "muted" },
  Processing: { label: "Processing", tone: "info" },
  Shipped: { label: "Shipped", tone: "primary" },
  Completed: { label: "Completed", tone: "success" },
  Pending: { label: "Pending", tone: "warning" },
  Cancelled: { label: "Cancelled", tone: "danger" },
};

export default function StatusBadge({ value, label }) {
  const entry = STATUS_MAP[value] || { label: label || value, tone: "neutral" };
  const text = label || entry.label;
  if (value === "NONE") return <span className={styles.dash}>—</span>;
  return <span className={`${styles.badge} ${styles[entry.tone]}`}>{text}</span>;
}
