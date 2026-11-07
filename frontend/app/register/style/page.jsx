"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import StepIndicator from "@/components/auth/StepIndicator";
import StyleGrid from "@/components/auth/StyleGrid";
import PrimaryButton from "@/components/auth/PrimaryButton";
import { useRegistration } from "@/context/RegistrationContext";
import { useUser } from "@/context/UserContext";
import { register as registerUser } from "@/lib/authService";
import styles from "./page.module.css";
import styleList from "@/data/styles";
import { getStyles } from "@/lib/styleService";

const MAX_STYLES = 3;

export default function RegisterStylePage() {
  const router = useRouter();
  const { data, isHydrated, saveSelectedStyles, clearRegistrationData } = useRegistration();
  const { login } = useUser();
  const [selectedIds, setSelectedIds] = useState([]);
  const [availableStyles, setAvailableStyles] = useState(styleList);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getStyles()
      .then((res) => {
        if (isMounted && Array.isArray(res) && res.length > 0) {
          const activeList = res.filter((item) => item.status !== "INACTIVE");
          if (activeList.length > 0) {
            setAvailableStyles(activeList);
          }
        }
      })
      .catch((err) => {
        console.warn("Lỗi tải phong cách từ API, sử dụng danh sách mặc định:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Nếu chưa hoàn thành /register (không có sđt trong dữ liệu tạm), quay
  // người dùng lại bước nhập thông tin tài khoản. Đợi context hydrate xong
  // từ sessionStorage trước khi kiểm tra, để tránh redirect nhầm khi user
  // tải lại trang /register/style trực tiếp.
  useEffect(() => {
    if (isHydrated && !data.phone && !isSuccess) {
      router.replace("/register");
    }
  }, [isHydrated, data.phone, isSuccess, router]);

  const maxReached = selectedIds.length >= MAX_STYLES;

  function toggleStyle(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= MAX_STYLES) {
        return prev;
      }
      return [...prev, id];
    });
  }

  async function submitRegistration(stylesToSave) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setServerError("");

    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        password: data.password,
        gender: data.gender || "unisex",
        dateOfBirth: data.dateOfBirth || data.date || null,
        date: data.dateOfBirth || data.date || null,
        selectedStyles: stylesToSave,
      };

      const res = await registerUser(payload);
      if (!res.success) {
        setServerError(res.message || "Đăng ký không thành công. Vui lòng thử lại.");
        setIsSubmitting(false);
        return;
      }

      // Đăng nhập người dùng ngay sau khi tạo tài khoản thành công
      const preferredStyle = stylesToSave[0] || "minimal";
      login(
        res.data?.user || {
          name: data.name,
          email: data.email,
          phoneNumber: data.phone,
          gender: data.gender || "unisex",
          dateOfBirth: data.dateOfBirth || data.date || null,
          date: data.dateOfBirth || data.date || null,
          stylePreference: preferredStyle,
        },
        preferredStyle,
        res.data?.token
      );

      clearRegistrationData();
      setIsSuccess(true);

      // Chuyển hướng sang trang Smart Outfit để khách khám phá các set đồ phù hợp theo giới tính & phong cách
      setTimeout(() => {
        router.push("/smart-outfit");
      }, 1200);
    } catch (err) {
      setServerError(err.message || "Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    saveSelectedStyles(selectedIds);
    submitRegistration(selectedIds);
  }

  function handleSkip() {
    saveSelectedStyles([]);
    submitRegistration([]);
  }

  if (isSuccess) {
    return (
      <AuthLayout contentMaxWidth="560px">
        <div className={styles.successState}>
          <span className={styles.successIcon} aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          <h1 className={styles.successTitle}>Đăng ký thành công!</h1>
          <p className={styles.successSubtitle}>
            Chào mừng bạn đến với Routine. Đang chuyển hướng bạn đến bộ sưu tập trang phục và phong cách phù hợp...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout contentMaxWidth="640px">
      <AuthHeader
        title="Bạn yêu thích phong cách nào?"
        subtitle="Chọn tối đa 3 phong cách để chúng tôi cá nhân hóa trải nghiệm và gợi ý outfit phù hợp với bạn."
      />

      <StepIndicator currentStep={2} />

      <div className={styles.counterRow}>
        <span className={`${styles.counter} ${selectedIds.length > 0 ? styles.counterActive : ""}`}>
          {selectedIds.length}/{MAX_STYLES} phong cách đã chọn
        </span>
      </div>

      <div className={styles.grid}>
        <StyleGrid
          styleList={availableStyles}
          selectedIds={selectedIds}
          maxReached={maxReached}
          onToggle={toggleStyle}
        />
      </div>

      {maxReached && (
        <p className={styles.maxHint}>Bạn đã chọn tối đa 3 phong cách.</p>
      )}

      {serverError && (
        <p className={styles.serverError}>
          {serverError}
        </p>
      )}

      <div className={styles.actions}>
        <PrimaryButton type="button" onClick={handleContinue} disabled={isSubmitting}>
          {isSubmitting ? "Đang hoàn tất..." : "Hoàn tất đăng ký"}
        </PrimaryButton>
        <button
          type="button"
          className={styles.skipButton}
          onClick={handleSkip}
          disabled={isSubmitting}
        >
          Bỏ qua
        </button>
      </div>
    </AuthLayout>
  );
}
