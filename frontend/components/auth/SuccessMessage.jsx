import styles from "./Message.module.css";

export default function SuccessMessage({ children, id }) {
  if (!children) return null;

  return (
    <p className={`${styles.message} ${styles.success}`} id={id} role="status">
      <svg
        className={styles.icon}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="6.25" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M4.3 7.2L6.1 9L9.7 5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </p>
  );
}
