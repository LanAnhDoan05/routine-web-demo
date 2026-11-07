"use client";

import { useState, useMemo, useEffect } from "react";
import { IconTikTok, IconFacebook, IconInstagram, IconCopy, IconLink } from "./icons";
import { generateCampaignUrl, getSiteOrigin } from "@/lib/analyticsService";
import { getProducts } from "@/lib/adminProductService";
import { useToast } from "./ToastProvider";
import styles from "./SocialLinkGeneratorModal.module.css";

export default function SocialLinkGeneratorModal({ isOpen, onClose, initialProductId = null }) {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || "");
  const [platform, setPlatform] = useState("tiktok");
  const [campaign, setCampaign] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const origin = getSiteOrigin();
      setCurrentOrigin(origin);
      if (!customDomain) {
        setCustomDomain(origin);
      }

      getProducts().then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          if (!selectedProductId && data.length > 0) {
            setSelectedProductId(initialProductId || data[0].id);
          }
        }
      });
    }
  }, [isOpen, initialProductId]);

  const effectiveOrigin = useMemo(() => {
    return (customDomain || currentOrigin || getSiteOrigin()).trim();
  }, [customDomain, currentOrigin]);

  const generatedUrl = useMemo(() => {
    if (!selectedProductId) return "";
    return generateCampaignUrl({
      productId: selectedProductId,
      platform,
      campaign,
      customDomain: effectiveOrigin,
    });
  }, [selectedProductId, platform, campaign, effectiveOrigin]);

  if (!isOpen) return null;

  function handleCopy() {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true);
      showToast(`Đã sao chép link tiếp thị cho ${platform.toUpperCase()}!`, "success");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast("Không thể sao chép vào bộ nhớ đệm", "error");
    });
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconLink size={20} />
            <h3 className={styles.title}>Tạo Link Tiếp Thị Mạng Xã Hội</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>1. Chọn sản phẩm gắn link</label>
            <select
              className={styles.select}
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.id}] {p.name} — {p.price?.toLocaleString()}đ
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>2. Chọn nền tảng mục tiêu</label>
            <div className={styles.platformPills}>
              <button
                type="button"
                className={`${styles.pillBtn} ${platform === "tiktok" ? styles.pillBtnActive_tiktok : ""}`}
                onClick={() => setPlatform("tiktok")}
              >
                <IconTikTok size={16} />
                <span>TikTok</span>
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${platform === "facebook" ? styles.pillBtnActive_facebook : ""}`}
                onClick={() => setPlatform("facebook")}
              >
                <IconFacebook size={16} />
                <span>Facebook</span>
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${platform === "instagram" ? styles.pillBtnActive_instagram : ""}`}
                onClick={() => setPlatform("instagram")}
              >
                <IconInstagram size={16} />
                <span>Instagram</span>
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>3. Tên chiến dịch (Tùy chọn)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="VD: summer_sale, livestream_01, bio_link..."
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
            />
          </div>

          <div className={styles.domainSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className={styles.label} style={{ margin: 0 }}>
                🌐 Tên miền áp dụng (Domain):
              </label>
              <button
                type="button"
                className={styles.domainEditToggle}
                onClick={() => setIsEditingDomain((prev) => !prev)}
              >
                {isEditingDomain ? "Đóng tùy chỉnh" : "Đổi tên miền..."}
              </button>
            </div>
            {isEditingDomain ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="VD: https://routine.vn hoặc https://your-app.vercel.app"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.domainResetBtn}
                  onClick={() => setCustomDomain(currentOrigin || getSiteOrigin())}
                  title="Đặt lại về tên miền tự nhận diện hiện tại"
                >
                  Tự động
                </button>
              </div>
            ) : (
              <div className={styles.domainBadge}>
                <span className={styles.domainDot}></span>
                <span className={styles.domainText}>{effectiveOrigin || "Đang phát hiện..."}</span>
              </div>
            )}
          </div>

          <div className={styles.resultBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Đường dẫn liên kết sinh ra:
              </span>
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
                ● Sẵn sàng chia sẻ
              </span>
            </div>
            <div className={styles.resultUrl}>{generatedUrl || "Chưa tạo được URL"}</div>

            <div className={styles.actionRow}>
              <button type="button" className={styles.copyBtn} onClick={handleCopy}>
                <IconCopy size={16} />
                <span>{copied ? "Đã sao chép!" : "Sao chép Link"}</span>
              </button>
              {generatedUrl && (
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.testBtn}
                >
                  Mở thử link ↗
                </a>
              )}
            </div>
          </div>

          <div className={styles.hint}>
            💡 <strong>Cơ chế tự động:</strong> Khi người xem nhấp link này trên {platform.toUpperCase()}, hệ thống sẽ tự động ghi nhận phiên <strong>Khách vãng lai</strong>. Nếu họ đăng ký tài khoản hoặc đặt hàng, đơn hàng sẽ được tính doanh thu cho chiến dịch {platform.toUpperCase()} trên Dashboard!
          </div>
        </div>
      </div>
    </div>
  );
}
