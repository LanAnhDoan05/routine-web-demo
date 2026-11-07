import Link from "next/link";

export default function Logo({ className = "" }) {
  return (
    <Link
      href="/"
      className={className}
      aria-label="Routine Thu Đông — về trang chủ"
      style={{
        fontSize: "clamp(16px, 1.8vw, 20px)",
        fontWeight: 700,
        letterSpacing: "0.12em",
        whiteSpace: "nowrap"
      }}
    >
      ROUTINE THU ĐÔNG
    </Link>
  );
}
