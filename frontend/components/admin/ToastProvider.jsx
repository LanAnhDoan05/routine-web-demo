"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { IconCheck, IconAlertCircle, IconX } from "./icons";
import styles from "./ToastProvider.module.css";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast phải được dùng bên trong <ToastProvider>.");
  }
  return ctx;
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success") => {
      counter.current += 1;
      const id = counter.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.stack} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${t.type === "error" ? styles.error : styles.success}`}>
            {t.type === "error" ? <IconAlertCircle size={18} /> : <IconCheck size={18} />}
            <span className={styles.message}>{t.message}</span>
            <button
              type="button"
              className={styles.close}
              aria-label="Đóng thông báo"
              onClick={() => dismiss(t.id)}
            >
              <IconX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
