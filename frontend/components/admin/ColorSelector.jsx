"use client";

import { useState } from "react";
import { getColorById, registerColor, toColorSlug, colorSwatch } from "@/data/colors";
import { IconCheck } from "./icons";
import styles from "./selectors.module.css";

export default function ColorSelector({ colorOptions = [], value = [], onChange, error }) {
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#2b5c8f");
  const [showAdd, setShowAdd] = useState(false);
  const [extraColors, setExtraColors] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);

  function isColorActive(c) {
    return (value || []).some((v) => {
      if (v === c.id || v === c.name) return true;
      const resolved = getColorById(v);
      return resolved?.id === c.id || resolved?.name?.toLowerCase() === c.name?.toLowerCase();
    });
  }

  function toggle(c) {
    const isSelected = isColorActive(c);
    if (isSelected) {
      const next = (value || []).filter((v) => {
        if (v === c.id || v === c.name) return false;
        const resolved = getColorById(v);
        return resolved?.id !== c.id && resolved?.name?.toLowerCase() !== c.name?.toLowerCase();
      });
      onChange(next);
    } else {
      const cleaned = (value || []).filter((v) => {
        if (v === c.id || v === c.name) return false;
        const resolved = getColorById(v);
        return resolved?.id !== c.id && resolved?.name?.toLowerCase() !== c.name?.toLowerCase();
      });
      onChange([...cleaned, c.id]);
    }
  }

  function handleRemoveColor(c) {
    if (!c || deletingIds.includes(c.id)) return;

    // 1. Kích hoạt hiệu ứng animation xóa (thu nhỏ, xoay nhẹ và mờ dần)
    setDeletingIds((prev) => [...prev, c.id]);

    setTimeout(() => {
      // 2. Sau khi animation kết thúc (300ms), ẩn màu khỏi bảng chọn
      setRemovedIds((prev) => [...prev, c.id, c.name, ...(c.id ? [c.id.toLowerCase()] : [])]);
      setDeletingIds((prev) => prev.filter((id) => id !== c.id));

      // 3. Nếu màu đang được chọn trong sản phẩm, hủy chọn và cập nhật danh sách biến thể
      if (isColorActive(c)) {
        const next = (value || []).filter((v) => {
          if (v === c.id || v === c.name) return false;
          const resolved = getColorById(v);
          return resolved?.id !== c.id && resolved?.name?.toLowerCase() !== c.name?.toLowerCase();
        });
        onChange(next);
      }
    }, 300);
  }

  function handleAddCustom() {
    const trimmed = customName.trim();
    if (!trimmed) return;

    // 1. Kiểm tra xem màu đã có sẵn trong từ điển chưa
    const existing = getColorById(trimmed);
    let targetColor = existing;

    if (!existing || existing.id.startsWith("color-custom-")) {
      const slug = toColorSlug(trimmed);
      const customId = `color-${slug || Date.now().toString(36)}`;
      targetColor = {
        id: customId,
        name: trimmed,
        hexCode: customHex,
        status: "ACTIVE",
      };
      registerColor(targetColor);
    } else if (customHex && customHex !== targetColor.hexCode) {
      targetColor = { ...targetColor, hexCode: customHex };
      registerColor(targetColor);
    }

    // Phục hồi lại nếu trước đó từng bấm nút xóa
    setRemovedIds((prev) => prev.filter((id) => id !== targetColor.id && id !== targetColor.name && id !== targetColor.id.toLowerCase()));

    setExtraColors((prev) => {
      const filtered = prev.filter((c) => c.id !== targetColor.id);
      return [...filtered, targetColor];
    });

    // Chọn ngay màu này
    if (!isColorActive(targetColor)) {
      toggle(targetColor);
    }

    setCustomName("");
    setShowAdd(false);
  }

  // Tổng hợp tất cả màu hiển thị trong bảng chọn
  const seenIds = new Set();
  const allColors = [];

  const addUnique = (c) => {
    if (!c || !c.id || seenIds.has(c.id.toLowerCase())) return;
    if (removedIds.includes(c.id) || removedIds.includes(c.name) || removedIds.includes(c.id.toLowerCase())) return;
    seenIds.add(c.id.toLowerCase());
    allColors.push(c);
  };

  (colorOptions || []).forEach(addUnique);
  extraColors.forEach(addUnique);

  (value || []).forEach((v) => {
    const cObj = getColorById(v);
    if (cObj) {
      addUnique(cObj);
    } else {
      const label = String(v).replace(/^color-/, "");
      addUnique({
        id: v,
        name: label.charAt(0).toUpperCase() + label.slice(1),
        hexCode: colorSwatch(label),
      });
    }
  });

  return (
    <div className={styles.field}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <label className={styles.label}>Colors</label>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-primary, #000)",
            fontSize: "12px",
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          {showAdd ? "Đóng" : "+ Thêm màu"}
        </button>
      </div>

      {showAdd && (
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px" }}>
          <input
            type="text"
            placeholder="Tên màu (VD: Xanh Rêu, Hồng, Đỏ...)"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            style={{
              padding: "5px 10px",
              fontSize: "12px",
              border: "1px solid var(--color-border, #ddd)",
              borderRadius: "4px",
              width: "160px",
            }}
          />
          <input
            type="color"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            style={{
              width: "32px",
              height: "28px",
              padding: 0,
              border: "1px solid #ccc",
              cursor: "pointer",
              borderRadius: "4px",
            }}
            title="Chọn mã màu"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              background: "var(--color-primary, #111)",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Thêm
          </button>
        </div>
      )}

      <div className={styles.swatchGrid} role="group" aria-label="Chọn màu sắc">
        {allColors.map((c) => {
          const active = isColorActive(c);
          const isLight = c.hexCode?.toLowerCase() === "#ffffff";
          const isDeleting = deletingIds.includes(c.id);

          return (
            <div
              key={c.id}
              className={`${styles.swatchWrapper} ${isDeleting ? styles.deletingColor : ""}`}
            >
              <div className={styles.circleContainer}>
                {/* Nút x nhỏ góc trên phải có hiệu ứng xóa màu */}
                <button
                  type="button"
                  className={styles.removeColorBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveColor(c);
                  }}
                  title={`Xóa màu ${c.name}`}
                  aria-label={`Xóa màu ${c.name}`}
                >
                  <svg
                    width="7"
                    height="7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <button
                  type="button"
                  className={styles.swatchCircleBtn}
                  onClick={() => toggle(c)}
                  aria-pressed={active}
                  title={c.name}
                >
                  <span
                    className={`${styles.swatchCircle} ${active ? styles.swatchCircleActive : ""}`}
                    style={{ background: c.hexCode, borderColor: isLight ? "var(--color-border)" : c.hexCode }}
                  >
                    {active ? <IconCheck size={14} style={{ color: isLight ? "#111" : "#fff" }} /> : null}
                  </span>
                </button>
              </div>

              <span
                className={styles.swatchLabel}
                onClick={() => toggle(c)}
                title={c.name}
              >
                {c.name}
              </span>
            </div>
          );
        })}
      </div>
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}
