import styles from "./Message.module.css";

export default function ErrorMessage({ children, id }) {
  if (!children) return null;

  return (
    <p className={`${styles.message} ${styles.error}`} id={id} role="alert">
      <svg
        className={styles.icon}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="6.25" stroke="currentColor" strokeWidth="1.3" />
        <path d="M7 4V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="7" cy="9.8" r="0.75" fill="currentColor" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
