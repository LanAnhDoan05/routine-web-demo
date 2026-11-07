import styles from "./AuthText.module.css";

export default function AuthHeader({ title, subtitle, as: Heading = "h1" }) {
  return (
    <div className={styles.header}>
      <Heading className={styles.title}>{title}</Heading>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
