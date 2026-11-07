import styles from "./Button.module.css";

export default function PrimaryButton({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  ...rest
}) {
  const variantClass = variant === "secondary" ? styles.secondary : styles.primary;

  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
