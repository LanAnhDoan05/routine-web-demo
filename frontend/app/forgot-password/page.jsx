"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import FormField from "@/components/auth/FormField";
import LoadingButton from "@/components/auth/LoadingButton";
import { validateEmail } from "@/lib/validation";
import { sendOtp } from "@/lib/authService";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const trimmedInput = email.trim();
  const isEmail = trimmedInput.includes("@");
  const isPhone = /^[0-9]{9,11}$/.test(trimmedInput);
  const isValidIdentifier = isEmail ? validateEmail(trimmedInput).valid : isPhone;
  const validationError = touched && !isValidIdentifier
    ? (isEmail ? "Email không hợp lệ." : "Vui lòng nhập email hoặc số điện thoại (9-11 số) hợp lệ.")
    : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!isValidIdentifier) return;

    setIsLoading(true);
    setServerError("");

    const res = await sendOtp(trimmedInput, "forgot_password");
    setIsLoading(false);

    if (!res.success) {
      setServerError(res.message);
      return;
    }

    router.push(`/forgot-password/verify?email=${encodeURIComponent(trimmedInput)}`);
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="Quên mật khẩu?"
        subtitle="Nhập email hoặc số điện thoại của bạn để nhận mã xác thực."
      />

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email hoặc Số điện thoại"
          type="text"
          name="identifier"
          placeholder="Nhập email hoặc số điện thoại"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched(true)}
          error={validationError}
          touched={touched}
          autoComplete="username"
        />

        {serverError && <p className={styles.serverError}>{serverError}</p>}

        <LoadingButton type="submit" isLoading={isLoading}>
          Tiếp tục
        </LoadingButton>
      </form>

      <p className={styles.footer}>
        <Link href="/login" className={styles.link}>
          Quay lại đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
