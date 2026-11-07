"use client";

import { IconChevronDown } from "./icons";
import styles from "./selectors.module.css";

export default function CategorySelector({ categories, value, onChange, error }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="category-select">
        Category <span className={styles.required}>*</span>
      </label>
      <div className={styles.selectWrap}>
        <select
          id="category-select"
          className={`${styles.select} ${error ? styles.selectError : ""}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "category-select-error" : undefined}
        >
          <option value="" disabled>
            Chọn category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <IconChevronDown size={16} className={styles.selectIcon} />
      </div>
      {error ? (
        <p id="category-select-error" className={styles.errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
