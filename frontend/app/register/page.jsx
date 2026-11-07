"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import StepIndicator from "@/components/auth/StepIndicator";
import FormField from "@/components/auth/FormField";
import PhoneField from "@/components/auth/PhoneField";
import PasswordField from "@/components/auth/PasswordField";
import PasswordStrength from "@/components/auth/PasswordStrength";
import PrimaryButton from "@/components/auth/PrimaryButton";
import { useRegistration } from "@/context/RegistrationContext";
import { checkExistence } from "@/lib/authService";
import {
  validateEmail,
  validateConfirmPassword,
  validatePassword,
  validatePhone,
  validateDateOfBirth,
} from "@/lib/validation";
import styles from "./page.module.css";

const initialForm = {
  name: "",
  gender: "men",
  dateOfBirth: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  agree: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const { saveAccountInfo } = useRegistration();

  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [serverError, setServerError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const nameError = form.name.trim() ? "" : "Vui lòng nhập họ và tên.";
  const dobCheck = validateDateOfBirth(form.dateOfBirth, false);
  const phoneCheck = validatePhone(form.phone);
  const emailCheck = validateEmail(form.email);
  const passwordCheck = validatePassword(form.password);
  const confirmCheck = validateConfirmPassword(form.password, form.confirmPassword);
  const agreeError = form.agree ? "" : "Vui lòng đồng ý với điều khoản sử dụng.";

  const isFormValid =
    !nameError &&
    dobCheck.valid &&
    phoneCheck.valid &&
    emailCheck.valid &&
    passwordCheck.valid &&
    confirmCheck.valid &&
    form.agree;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({
      name: true,
      gender: true,
      dateOfBirth: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
      agree: true,
    });

    if (!isFormValid || isChecking) return;

    setIsChecking(true);
    setServerError("");

    try {
      const check = await checkExistence({
        email: form.email.trim(),
        phone: form.phone,
      });

      if (check.exists) {
        setIsChecking(false);
        setServerError(
          check.phoneExists && check.emailExists
            ? "Số điện thoại và email này đều đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc chọn Quên mật khẩu."
            : check.phoneExists
            ? "Số điện thoại này đã được đăng ký tài khoản khác. Vui lòng kiểm tra lại hoặc đăng nhập."
            : "Địa chỉ email này đã được sử dụng. Vui lòng kiểm tra lại hoặc đăng nhập."
        );
        return;
      }
    } catch (err) {
      console.warn("Lỗi kiểm tra trùng lặp tài khoản:", err);
    } finally {
      setIsChecking(false);
    }

    saveAccountInfo({
      name: form.name.trim(),
      gender: form.gender || "men",
      dateOfBirth: form.dateOfBirth,
      date: form.dateOfBirth,
      phone: form.phone,
      email: form.email.trim(),
      password: form.password,
    });

    router.push("/register/style");
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="Tạo tài khoản"
        subtitle="Tham gia Routine và bắt đầu xây dựng phong cách của riêng bạn."
      />

      <StepIndicator currentStep={1} />

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          label="Họ và tên"
          placeholder="Nhập họ và tên"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => markTouched("name")}
          error={nameError}
          touched={touched.name}
        />

        <div className={styles.genderGroup}>
          <label className={styles.genderLabel}>
            Giới tính <span className={styles.genderSubLabel}>(để Routine gợi ý outfit chuẩn dáng cho bạn)</span>
          </label>
          <div className={styles.genderOptions}>
            <button
              type="button"
              className={`${styles.genderBtn} ${form.gender === "men" ? styles.genderBtnActive : ""}`}
              onClick={() => updateField("gender", "men")}
            >
              <span className={styles.genderIcon}>♂</span> Nam
            </button>
            <button
              type="button"
              className={`${styles.genderBtn} ${form.gender === "women" ? styles.genderBtnActive : ""}`}
              onClick={() => updateField("gender", "women")}
            >
              <span className={styles.genderIcon}>♀</span> Nữ
            </button>
            <button
              type="button"
              className={`${styles.genderBtn} ${form.gender === "unisex" ? styles.genderBtnActive : ""}`}
              onClick={() => updateField("gender", "unisex")}
            >
              <span className={styles.genderIcon}>✦</span> Khác
            </button>
          </div>
        </div>

        <div className={styles.dobGroup}>
          <label className={styles.dobLabel} htmlFor="register-dob">
            Ngày tháng năm sinh <span className={styles.dobSubLabel}>(để Routine gửi ưu đãi sinh nhật đặc biệt 🎂)</span>
          </label>
          <div className={styles.dobInputWrap}>
            <input
              id="register-dob"
              type="date"
              name="dateOfBirth"
              className={styles.dobInput}
              value={form.dateOfBirth}
              max={new Date().toISOString().split("T")[0]}
              min="1920-01-01"
              onChange={(e) => updateField("dateOfBirth", e.target.value)}
              onBlur={() => markTouched("dateOfBirth")}
              aria-invalid={Boolean(touched.dateOfBirth && !dobCheck.valid)}
            />
          </div>
          {touched.dateOfBirth && !dobCheck.valid && (
            <p className={styles.dobError}>{dobCheck.message}</p>
          )}
        </div>

        <PhoneField
          value={form.phone}
          onChange={(value) => updateField("phone", value)}
          onBlur={() => markTouched("phone")}
          error={phoneCheck.message}
          touched={touched.phone}
        />

        <FormField
          label="Email"
          placeholder="Nhập email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          onBlur={() => markTouched("email")}
          error={emailCheck.message}
          touched={touched.email}
        />

        <PasswordField
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          name="password"
          value={form.password}
          onChange={(value) => updateField("password", value)}
          onBlur={() => markTouched("password")}
          error={passwordCheck.message}
          touched={touched.password}
        />

        <div className={styles.passwordStrengthSlot}>
          <PasswordStrength checklist={passwordCheck.checklist} />
        </div>

        <PasswordField
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={(value) => updateField("confirmPassword", value)}
          onBlur={() => markTouched("confirmPassword")}
          error={confirmCheck.message}
          touched={touched.confirmPassword}
        />

        <label className={styles.termsRow}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={form.agree}
            onChange={(e) => {
              updateField("agree", e.target.checked);
              markTouched("agree");
            }}
          />
          <span className={styles.termsLabel}>
            Tôi đồng ý với{" "}
            <Link href="#" className={styles.termsLink}>
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="#" className={styles.termsLink}>
              Chính sách bảo mật
            </Link>
            .
          </span>
        </label>
        {touched.agree && agreeError && (
          <p className={styles.serverError} style={{ marginTop: "-16px" }}>
            {agreeError}
          </p>
        )}

        {serverError && (
          <p className={styles.serverError} style={{ marginBottom: "16px" }}>
            {serverError}
          </p>
        )}

        <PrimaryButton type="submit" disabled={isChecking}>
          {isChecking ? "Đang kiểm tra..." : "Tiếp tục"}
        </PrimaryButton>
      </form>

      <p className={styles.footer}>
        Bạn đã có tài khoản?{" "}
        <Link href="/login" className={styles.link}>
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
