import styles from "./PageHeader.module.css";

export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.text}>
        {breadcrumb ? <p className={styles.breadcrumb}>{breadcrumb}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
