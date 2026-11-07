"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import StepIndicator from "@/components/auth/StepIndicator";
import OtpInput from "@/components/auth/OtpInput";
import CountdownTimer from "@/components/auth/CountdownTimer";
import LoadingButton from "@/components/auth/LoadingButton";
import ErrorMessage from "@/components/auth/ErrorMessage";
import { useRegistration } from "@/context/RegistrationContext";
import { useUser } from "@/context/UserContext";
import { maskEmail, maskPhone, validateOtp } from "@/lib/validation";
import { sendOtp, verifyOtp, register as registerUser } from "@/lib/authService";
import styles from "./page.module.css";

const REDIRECT_DELAY = 1400;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, clearRegistrationData } = useRegistration();
  const { login } = useUser();

  const flow = searchParams.get("flow") === "register" ? "register" : "login";
  const email = searchParams.get("email") || data.email || "";
  const phone = searchParams.get("phone") || data.phone || "";
  const target = email || phone || "";
  const secondary = target === email ? phone : email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const otpSentRef = useRef(false);

  useEffect(() => {
    if (flow === "register") {
      router.replace("/register");
      return;
    }
    if (target && !otpSentRef.current) {
      otpSentRef.current = true;
      sendOtp(target, flow, secondary)
        .then((res) => {
          if (!res.success) {
            setError(res.message);
          }
        })
        .catch(() => {});
    }
  }, [target, flow, secondary, router]);

  async function handleResend() {
    setError("");
    const res = await sendOtp(target, flow, secondary);
    if (!res.success) {
      setError(res.message || "Không thể gửi lại mã OTP.");
    }
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

    const res = await verifyOtp(target, otp);
    setIsVerifying(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    if (flow === "register") {
      const regRes = await registerUser({ ...data, phone, email });
      if (!regRes.success) {
        setError(regRes.message || "Đăng ký không thành công. Vui lòng thử lại.");
        return;
      }
      login(
        regRes.data?.user || { name: data.name, email: data.email, phoneNumber: phone },
        data.selectedStyles?.[0] || "minimal",
        regRes.data?.token
      );
      clearRegistrationData();
    } else {
      login(phone ? `Khách hàng (${phone.slice(-4)})` : "Khách hàng", "minimal");
    }

    setIsSuccess(true);
    setTimeout(() => {
      router.push("/");
    }, REDIRECT_DELAY);
  }

  return (
    <AuthLayout>
      {isSuccess ? (
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
          <h1 className={styles.successTitle}>Xác thực thành công</h1>
          <p className={styles.successSubtitle}>
            {flow === "register"
              ? "Chào mừng bạn đến với Routine."
              : "Đăng nhập thành công."}
          </p>
        </div>
      ) : (
        <>
          <AuthHeader
            title="Xác thực tài khoản"
            subtitle={`Mã xác thực đã được gửi đến ${email ? "email" : "số điện thoại"} của bạn.`}
          />

          {flow === "register" && <StepIndicator currentStep={3} />}

          <p className={styles.maskedPhone}>
            {email ? maskEmail(email) : maskPhone(phone)}
          </p>

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
                describedById={error ? "otp-error" : undefined}
              />
            </div>

            {error && (
              <div style={{ marginTop: "12px", textAlign: "center" }}>
                <ErrorMessage id="otp-error">{error}</ErrorMessage>
                {error.includes("đã được") && (
                  <p style={{ marginTop: "8px", fontSize: "14px" }}>
                    <Link href="/login" style={{ color: "var(--color-primary, #000)", fontWeight: 600, textDecoration: "underline" }}>
                      👉 Bấm vào đây để đăng nhập ngay
                    </Link>
                  </p>
                )}
              </div>
            )}

            <div className={styles.countdownRow}>
              <CountdownTimer seconds={45} onResend={handleResend} disabled={isVerifying} />
            </div>

            <LoadingButton type="submit" isLoading={isVerifying}>
              Xác nhận
            </LoadingButton>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
}
