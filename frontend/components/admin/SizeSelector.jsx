"use client";

import { useState } from "react";
import styles from "./selectors.module.css";

export default function SizeSelector({ sizeOptions, value = [], onChange, error }) {
  const [customSize, setCustomSize] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [extraSizes, setExtraSizes] = useState([]);

  function toggle(id) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function handleAddCustom() {
    const trimmed = customSize.trim().toUpperCase();
    if (!trimmed) return;
    const customId = `size-${trimmed.toLowerCase()}`;
    if (!extraSizes.some((s) => s.id === customId) && !sizeOptions.some((s) => s.id === customId || s.name.toUpperCase() === trimmed)) {
      setExtraSizes((prev) => [...prev, { id: customId, name: trimmed }]);
    }
    if (!value.includes(customId) && !value.includes(trimmed)) {
      onChange([...value, customId]);
    }
    setCustomSize("");
    setShowAdd(false);
  }

  const allSizes = [...sizeOptions, ...extraSizes];
  (value || []).forEach((v) => {
    if (!allSizes.some((s) => s.id === v || s.name === v)) {
      allSizes.push({ id: v, name: String(v).replace(/^size-/, "").toUpperCase() });
    }
  });

  return (
    <div className={styles.field}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <label className={styles.label}>Sizes</label>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: "none", border: "none", color: "var(--color-primary, #000)", fontSize: "12px", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
        >
          {showAdd ? "Đóng" : "+ Thêm size"}
        </button>
      </div>

      {showAdd && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
          <input
            type="text"
            placeholder="VD: 3XL, FreeSize..."
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustom(); } }}
            style={{ padding: "5px 10px", fontSize: "12px", border: "1px solid var(--color-border, #ddd)", borderRadius: "4px", width: "140px" }}
          />
          <button
            type="button"
            onClick={handleAddCustom}
            style={{ padding: "5px 12px", fontSize: "12px", background: "var(--color-primary, #111)", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 500 }}
          >
            Thêm
          </button>
        </div>
      )}

      <div className={styles.sizeGrid} role="group" aria-label="Chọn kích cỡ">
        {allSizes.map((s) => {
          const active = value.includes(s.id) || value.includes(s.name);
          return (
            <button
              type="button"
              key={s.id}
              className={`${styles.sizeChip} ${active ? styles.sizeChipActive : ""}`}
              onClick={() => toggle(s.id)}
              aria-pressed={active}
            >
              {s.name}
            </button>
          );
        })}
      </div>
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}
