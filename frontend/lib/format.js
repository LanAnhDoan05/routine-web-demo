export function formatPrice(value) {
  if (value == null) return "";
  return value.toLocaleString("vi-VN") + "₫";
}

export const formatCurrency = formatPrice;

export function formatNumber(value) {
  if (value == null) return "0";
  return Number(value).toLocaleString("vi-VN");
}

export function formatCompactNumber(value) {
  if (value == null) return "0";
  const num = Number(value);
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString("vi-VN");
}

// Formats an ISO date string as "06 Sep 2026" to match the mock
// order examples used across Orders / Order Detail / Order Success.
export function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

