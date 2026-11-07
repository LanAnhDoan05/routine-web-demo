"use client";

import { useId, useState } from "react";
import styles from "./FormField.module.css";
import ErrorMessage from "./ErrorMessage";

function EyeIcon({ visible }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M1.5 9C1.5 9 4.5 3.5 9 3.5C13.5 3.5 16.5 9 16.5 9C16.5 9 13.5 14.5 9 14.5C4.5 14.5 1.5 9 1.5 9Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="9" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2.5 2.5L15.5 15.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M4.6 4.9C2.6 6.1 1.5 9 1.5 9C1.5 9 4.5 14.5 9 14.5C10.4 14.5 11.6 14 12.6 13.3M7.2 3.7C7.8 3.6 8.4 3.5 9 3.5C13.5 3.5 16.5 9 16.5 9C16.5 9 15.9 10.2 14.8 11.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 10.6C7 10.2 6.75 9.63 6.75 9C6.75 7.76 7.76 6.75 9 6.75C9.63 6.75 10.2 7 10.6 7.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Field mật khẩu với nút hiện/ẩn. Không tự render checklist yêu cầu mật khẩu
 * (đó là việc của PasswordStrength) để field này tái sử dụng được cho cả
 * "Mật khẩu" lẫn "Xác nhận mật khẩu".
 */
export default function PasswordField({
  label = "Mật khẩu",
  placeholder = "Nhập mật khẩu",
  value,
  onChange,
  onBlur,
  error,
  touched,
  id,
  name = "password",
  autoComplete = "new-password",
}) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const showError = Boolean(touched && error);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={`${styles.input} ${styles.inputWithToggle}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
        />
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
        >
          <EyeIcon visible={visible} />
        </button>
      </div>
      {showError && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </div>
  );
}
