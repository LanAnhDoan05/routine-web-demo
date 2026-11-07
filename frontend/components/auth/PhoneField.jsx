"use client";

import { useId } from "react";
import styles from "./FormField.module.css";
import ErrorMessage from "./ErrorMessage";

/**
 * Field số điện thoại dùng chung cho Login, Register, Forgot password.
 * Chỉ cho phép nhập chữ số (và dấu "+" ở đầu cho mã quốc gia).
 */
export default function PhoneField({
  label = "Số điện thoại",
  placeholder = "Nhập số điện thoại",
  value,
  onChange,
  onBlur,
  error,
  touched,
  id,
  name = "phone",
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const showError = Boolean(touched && error);

  function handleChange(e) {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9+]/g, "");
    onChange(cleaned);
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={inputId}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          maxLength={12}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
        />
      </div>
      {showError && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </div>
  );
}
