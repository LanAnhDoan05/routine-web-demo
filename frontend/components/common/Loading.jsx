export default function Loading({ label = "Đang tải..." }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10 }}>
      <span
        aria-hidden="true"
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "2px solid var(--color-border)",
          borderTopColor: "var(--color-primary)",
          animation: "spin 0.7s linear infinite"
        }}
      />
      <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>{label}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
