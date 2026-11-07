"use client";

import { useId } from "react";
import styles from "./FormField.module.css";
import ErrorMessage from "./ErrorMessage";

/**
 * Field text chung (họ tên, email, ...). Label luôn hiển thị (không chỉ là
 * placeholder) để đảm bảo accessibility, kể cả khi field đang có giá trị.
 */
export default function FormField({
  label,
  error,
  touched,
  id,
  ...inputProps
}) {
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
          className={styles.input}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          {...inputProps}
        />
      </div>
      {showError && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </div>
  );
}
