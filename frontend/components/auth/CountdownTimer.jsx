"use client";

import { useEffect, useState } from "react";
import styles from "./CountdownTimer.module.css";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Đếm ngược "Gửi lại mã sau 00:45"; khi hết giờ, đổi thành nút "Gửi lại mã".
 * Tự quản lý thời gian nội bộ, chỉ gọi ra ngoài qua `onResend`.
 */
export default function CountdownTimer({
  seconds = 45,
  onResend,
  disabled = false,
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (remaining <= 0) return undefined;

    const timerId = setTimeout(() => {
      setRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timerId);
  }, [remaining]);

  async function handleResend() {
    if (disabled || isResending) return;

    setIsResending(true);
    try {
      await onResend?.();
      setRemaining(seconds);
    } finally {
      setIsResending(false);
    }
  }

  if (remaining > 0) {
    return (
      <p className={styles.wrap}>
        Gửi lại mã sau <span className={styles.time}>{formatTime(remaining)}</span>
      </p>
    );
  }

  return (
    <p className={styles.wrap}>
      <button
        type="button"
        className={styles.resendButton}
        onClick={handleResend}
        disabled={disabled || isResending}
      >
        {isResending ? "Đang gửi lại..." : "Gửi lại mã"}
      </button>
    </p>
  );
}
