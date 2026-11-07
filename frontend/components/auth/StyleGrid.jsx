import styles from "./StyleGrid.module.css";
import StyleCard from "./StyleCard";

export default function StyleGrid({ styleList, selectedIds, maxReached, onToggle }) {
  return (
    <div className={styles.grid}>
      {styleList.map((style) => {
        const selected = selectedIds.includes(style.id);
        return (
          <StyleCard
            key={style.id}
            style={style}
            selected={selected}
            disabled={maxReached && !selected}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
}
