"use client";

import { IconCheck } from "./icons";
import styles from "./selectors.module.css";

export default function StyleSelector({ styleOptions, value, onChange, error }) {
  function toggle(id) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <div className={styles.field}>
      <label className={styles.label}>Style</label>
      <p className={styles.hint}>Một sản phẩm có thể thuộc nhiều style.</p>
      <div className={styles.checkGrid} role="group" aria-label="Chọn style">
        {styleOptions.map((s) => {
          const active = value.includes(s.id);
          return (
            <label key={s.id} className={`${styles.checkItem} ${active ? styles.checkItemActive : ""}`}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={active}
                onChange={() => toggle(s.id)}
              />
              <span>{s.name}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}
