import PageHeader from "./PageHeader";
import EmptyState from "./EmptyState";
import styles from "./PlaceholderPage.module.css";

export default function PlaceholderPage({ title, subtitle, icon, message }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className={styles.card}>
        <EmptyState icon={icon} title={title} description={message} />
      </div>
    </div>
  );
}
