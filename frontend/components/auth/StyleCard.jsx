import styles from "./StyleCard.module.css";

export default function StyleCard({ style, selected, disabled, onToggle }) {
  const cardClass = [
    styles.card,
    selected ? styles.selected : "",
    disabled ? styles.disabled : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cardClass}
      onClick={() => onToggle(style.id)}
      disabled={disabled}
      aria-pressed={selected}
    >
      <span className={styles.imageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.image}
          src={style.image || style.imageUrl || "/images/styles/basic.jpg"}
          alt={style.name || "Phong cách"}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/styles/basic.jpg";
          }}
        />
        {selected && <span className={styles.overlay} aria-hidden="true" />}
      </span>

      <span className={styles.body}>
        <span className={styles.textGroup}>
          <span className={styles.name}>{style.name}</span>
          <span className={styles.description}>{style.description}</span>
        </span>

        <span
          className={`${styles.checkInline} ${
            selected ? styles.checkInlineSelected : ""
          }`}
        >
          {selected && (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path
                d="M2 5.6L4.3 8L9 3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}
