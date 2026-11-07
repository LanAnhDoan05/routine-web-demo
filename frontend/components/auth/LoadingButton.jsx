import styles from "./Button.module.css";
import PrimaryButton from "./PrimaryButton";

/**
 * Bọc PrimaryButton, quản lý trạng thái loading khi submit form:
 * disable input, hiện spinner, đổi nhãn sang `loadingText`.
 */
export default function LoadingButton({
  children,
  loadingText = "Đang xử lý...",
  isLoading = false,
  disabled = false,
  variant = "primary",
  type = "submit",
  ...rest
}) {
  return (
    <PrimaryButton
      type={type}
      variant={variant}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      {isLoading ? loadingText : children}
    </PrimaryButton>
  );
}
