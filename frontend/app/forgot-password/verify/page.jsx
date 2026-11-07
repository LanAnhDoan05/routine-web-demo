"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import OtpInput from "@/components/auth/OtpInput";
import CountdownTimer from "@/components/auth/CountdownTimer";
import LoadingButton from "@/components/auth/LoadingButton";
import ErrorMessage from "@/components/auth/ErrorMessage";
import { maskEmail, maskPhone, validateOtp } from "@/lib/validation";
import { sendOtp, verifyOtp } from "@/lib/authService";
import styles from "./page.module.css";

function ForgotPasswordVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || searchParams.get("phone") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleResend() {
    setError("");
    const res = await sendOtp(email);
    if (!res.success) setError(res.message || "Không thể gửi lại mã OTP.");
  }

  async function handleVerify(e) {
    e.preventDefault();

    const check = validateOtp(otp);
    if (!check.valid) {
      setError(check.message);
      return;
    }

    setIsVerifying(true);
    setError("");

    const res = await verifyOtp(email, otp);
    setIsVerifying(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  const isEmail = email.includes("@");

  return (
    <AuthLayout>
      <AuthHeader
        title="Xác thực để đặt lại mật khẩu"
        subtitle={`Mã xác thực đã được gửi đến ${isEmail ? "email" : "số điện thoại"} của bạn.`}
      />

      <p className={styles.maskedPhone}>{isEmail ? maskEmail(email) : maskPhone(email)}</p>

      <form onSubmit={handleVerify} noValidate>
        <div className={styles.otpWrap}>
          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (error) setError("");
            }}
            error={Boolean(error)}
            disabled={isVerifying}
            describedById={error ? "fp-otp-error" : undefined}
          />
        </div>

        {error && <ErrorMessage id="fp-otp-error">{error}</ErrorMessage>}

        <div className={styles.countdownRow}>
          <CountdownTimer seconds={45} onResend={handleResend} disabled={isVerifying} />
        </div>

        <LoadingButton type="submit" isLoading={isVerifying}>
          Xác nhận
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}

export default function ForgotPasswordVerifyPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordVerifyContent />
    </Suspense>
  );
}
