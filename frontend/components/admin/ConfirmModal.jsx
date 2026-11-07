"use client";

import { useEffect, useRef } from "react";
import { IconAlertCircle, IconX } from "./icons";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({
  open,
  title = "Xác nhận",
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
      const onKeyDown = (e) => {
        if (e.key === "Escape") onCancel?.();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div className={styles.modal} role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <button type="button" className={styles.closeBtn} aria-label="Đóng" onClick={onCancel}>
          <IconX size={16} />
        </button>
        <div className={`${styles.icon} ${tone === "danger" ? styles.iconDanger : styles.iconNeutral}`}>
          <IconAlertCircle size={20} />
        </div>
        <h2 id="confirm-modal-title" className={styles.title}>
          {title}
        </h2>
        {description ? <p className={styles.description}>{description}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={tone === "danger" ? styles.confirmDangerBtn : styles.confirmBtn}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Đang xử lý…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
