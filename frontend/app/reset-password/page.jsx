"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import PasswordField from "@/components/auth/PasswordField";
import PasswordStrength from "@/components/auth/PasswordStrength";
import LoadingButton from "@/components/auth/LoadingButton";
import {
  getPasswordStrength,
  validateConfirmPassword,
  validatePassword,
} from "@/lib/validation";
import { resetPassword } from "@/lib/authService";
import styles from "./page.module.css";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("email") || searchParams.get("phone") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const passwordCheck = validatePassword(password);
  const confirmCheck = validateConfirmPassword(password, confirmPassword);
  const strength = getPasswordStrength(password);

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });

    if (!passwordCheck.valid || !confirmCheck.valid) return;

    setIsLoading(true);
    setServerError("");

    const res = await resetPassword(identifier, password);
    setIsLoading(false);

    if (!res.success) {
      setServerError(res.message);
      return;
    }

    router.push("/reset-password/success");
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="Đặt lại mật khẩu"
        subtitle="Tạo mật khẩu mới cho tài khoản của bạn."
      />

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <PasswordField
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          name="newPassword"
          value={password}
          onChange={(value) => setPassword(value)}
          onBlur={() => markTouched("password")}
          error={passwordCheck.message}
          touched={touched.password}
        />

        <div className={styles.passwordStrengthSlot}>
          <PasswordStrength checklist={passwordCheck.checklist} strength={strength} />
        </div>

        <PasswordField
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu mới"
          name="confirmNewPassword"
          value={confirmPassword}
          onChange={(value) => setConfirmPassword(value)}
          onBlur={() => markTouched("confirmPassword")}
          error={confirmCheck.message}
          touched={touched.confirmPassword}
        />

        {serverError && <p className={styles.serverError}>{serverError}</p>}

        <LoadingButton type="submit" isLoading={isLoading}>
          Cập nhật mật khẩu
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
