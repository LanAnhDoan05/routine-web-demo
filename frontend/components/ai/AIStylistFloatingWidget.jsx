"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import AIStylistChat from "./AIStylistChat";
import styles from "./AIStylistFloatingWidget.module.css";

export default function AIStylistFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customProductId, setCustomProductId] = useState(null);
  const pathname = usePathname() || "";

  useEffect(() => {
    function handleOpenStylistEvent(e) {
      setIsOpen(true);
      if (e?.detail?.productId) {
        setCustomProductId(e.detail.productId);
      }
      if (e?.detail?.productName) {
        setCustomPrompt(`Gợi ý cho mình set đồ phối ăn ý nhất với "${e.detail.productName}"`);
      }
    }
    window.addEventListener("open-ai-stylist", handleOpenStylistEvent);
    return () => window.removeEventListener("open-ai-stylist", handleOpenStylistEvent);
  }, []);

  // Ẩn nếu đang ở trang AI Stylist chính hoặc trang admin / auth
  if (
    pathname.startsWith("/smart-outfit/ai-stylist") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return null;
  }

  // Phát hiện nếu khách đang ở trang chi tiết sản phẩm để lấy ID
  let currentProductId = null;
  if (pathname.startsWith("/product/")) {
    currentProductId = pathname.replace("/product/", "").split("/")[0];
  }

  return (
    <div className={styles.aiFloatingRoot}>
      {/* Cửa sổ chat dạng Popup */}
      {isOpen && (
        <div className={styles.aiPopupWindow} role="dialog" aria-label="Routine AI Stylist Chat">
          <div className={styles.aiPopupHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.onlineIndicator}></div>
              <div>
                <h4 className={styles.headerTitle}>ROUTINE AI STYLIST</h4>
                <p className={styles.headerSubtitle}>
                  {currentProductId ? "Đang xem sản phẩm — Gợi ý phối đồ" : "Trợ lý thời trang trực tuyến"}
                </p>
              </div>
            </div>

            <div className={styles.headerActions}>
              <Link
                href="/smart-outfit/ai-stylist"
                className={styles.btnHeaderAction}
                title="Mở toàn màn hình"
                onClick={() => setIsOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </Link>

              <button
                type="button"
                className={styles.btnHeaderAction}
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.aiPopupBody}>
            <AIStylistChat
              embedded={true}
              currentProductId={customProductId || currentProductId}
              initialPrompt={customPrompt || (currentProductId ? "Gợi ý cho mình đồ phối hợp với sản phẩm này nhé" : "")}
            />
          </div>
        </div>
      )}

      {/* Bong bóng tròn nổi góc phải */}
      <button
        type="button"
        className={`${styles.aiFloatingTrigger} ${isOpen ? styles.isActive : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Mở Trợ lý AI Stylist"
      >
        <span className={styles.triggerIcon}>
          {isOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
          )}
        </span>

        {!isOpen && (
          <span className={styles.triggerLabel}>
            <span className={styles.sparkle}>✨</span> AI Stylist
          </span>
        )}
      </button>
    </div>
  );
}
