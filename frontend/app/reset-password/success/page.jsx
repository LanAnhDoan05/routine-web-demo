"use client";

import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import PrimaryButton from "@/components/auth/PrimaryButton";
import styles from "./page.module.css";

export default function ResetPasswordSuccessPage() {
  const router = useRouter();

  return (
    <AuthLayout>
      <div className={styles.successState}>
        <span className={styles.successIcon} aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="12" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M7.5 13.2L11 16.8L18.5 8.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className={styles.successTitle}>Đặt lại mật khẩu thành công</h1>
        <p className={styles.successSubtitle}>
          Bạn có thể sử dụng mật khẩu mới để đăng nhập.
        </p>
        <div className={styles.actionWrap}>
          <PrimaryButton type="button" onClick={() => router.push("/login")}>
            Đăng nhập
          </PrimaryButton>
        </div>
      </div>
    </AuthLayout>
  );
}
