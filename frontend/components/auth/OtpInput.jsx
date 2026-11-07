"use client";

import { useEffect, useRef } from "react";
import styles from "./OtpInput.module.css";

/**
 * 6 ô nhập OTP độc lập nhưng điều khiển bởi một giá trị string duy nhất
 * (`value`) để component cha (trang /verify-otp) dễ validate & submit.
 *
 * Hỗ trợ: chỉ số, auto focus ô đầu, auto move sang ô kế khi nhập,
 * Backspace quay lại ô trước, paste toàn bộ mã cùng lúc.
 */
export default function OtpInput({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = true,
  describedById,
}) {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  function setDigitAt(index, digit) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  }

  function handleChange(index, e) {
    const raw = e.target.value;
    const digit = raw.replace(/[^0-9]/g, "").slice(-1);

    if (!digit) {
      setDigitAt(index, "");
      return;
    }

    setDigitAt(index, digit);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigitAt(index, "");
        return;
      }
      if (index > 0) {
        e.preventDefault();
        setDigitAt(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, length);

    if (!pasted) return;

    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div
      className={styles.group}
      role="group"
      aria-label="Mã xác thực OTP gồm 6 chữ số"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          className={`${styles.box} ${error ? styles.boxError : ""}`}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedById}
          aria-label={`Chữ số OTP thứ ${index + 1}`}
        />
      ))}
    </div>
  );
}
