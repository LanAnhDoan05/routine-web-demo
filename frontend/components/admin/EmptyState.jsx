import { IconArchive } from "./icons";
import styles from "./EmptyState.module.css";

export default function EmptyState({
  icon,
  title = "Chưa có dữ liệu",
  description,
  action,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon || <IconArchive size={22} />}</div>
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
