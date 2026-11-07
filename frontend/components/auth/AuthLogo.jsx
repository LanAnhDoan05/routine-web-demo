import Link from "next/link";
import styles from "./AuthText.module.css";

/**
 * Wordmark "ROUTINE". `variant="light"` dùng khi đặt trên nền ảnh tối
 * (panel bên trái của AuthLayout).
 */
export default function AuthLogo({ variant = "dark" }) {
  return (
    <Link
      href="/"
      className={`${styles.logo} ${variant === "light" ? styles.logoLight : ""}`}
      aria-label="Về trang chủ Routine Thu Đông"
    >
      ROUTINE THU ĐÔNG
    </Link>
  );
}
