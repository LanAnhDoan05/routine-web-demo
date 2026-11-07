"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPromptModal({ isOpen, onClose, title, message, redirectUrl }) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleGoLogin() {
    onClose();
    router.push(redirectUrl || "/login");
  }

  function handleGoRegister() {
    onClose();
    router.push("/register");
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1100,
        backgroundColor: "rgba(17, 17, 17, 0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Yêu cầu đăng nhập"}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "420px",
          textAlign: "center",
          padding: "36px 28px 28px",
          borderRadius: "8px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)",
          animation: "fade-in 0.2s ease",
        }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Đóng"
          style={{ top: 14, right: 14, fontSize: 22, color: "var(--color-text-secondary)" }}
        >
          ×
        </button>

        {/* Icon Lock / User */}
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            backgroundColor: "var(--color-bg-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "var(--color-primary)",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px", letterSpacing: "-0.01em" }}>
          {title || "Đăng nhập để tiếp tục"}
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
            marginBottom: "24px",
          }}
        >
          {message || "Vui lòng đăng nhập hoặc tạo tài khoản để thực hiện thao tác này và lưu thông tin của bạn."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={handleGoLogin}
            style={{ padding: "12px 20px", fontSize: "14px", fontWeight: 500 }}
          >
            Đăng nhập ngay
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={handleGoRegister}
            style={{ padding: "12px 20px", fontSize: "14px", fontWeight: 500 }}
          >
            Tạo tài khoản mới
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: "4px",
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
            }}
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
