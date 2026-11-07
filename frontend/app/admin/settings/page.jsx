"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/ToastProvider";
import { fetchApi } from "@/lib/api";
import { DEFAULT_PRODUCT_CARD_CONFIG } from "@/context/ProductCardSettingsContext";
import styles from "./page.module.css";

const DISPLAY_OPTIONS = [
  ["showOriginalPrice", "Giá gốc"],
  ["showSalePrice", "Giá khuyến mãi"],
  ["showSaleBadge", "Nhãn SALE"],
  ["showNewBadge", "Nhãn NEW"],
  ["showColorSwatches", "Màu sắc"],
  ["showQuickAdd", "Nút thêm vào giỏ"],
  ["showWishlist", "Nút yêu thích"],
];

export default function SettingsPage() {
  const { showToast } = useToast();
  const [config, setConfig] = useState(DEFAULT_PRODUCT_CARD_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    fetchApi("/settings/product-card")
      .then((data) => {
        if (active && data) setConfig({ ...DEFAULT_PRODUCT_CARD_CONFIG, ...data });
      })
      .catch((error) => {
        if (active) setLoadError(error.message || "Không thể tải cấu hình từ máy chủ.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function update(field, value) {
    setConfig((current) => ({ ...current, [field]: value }));
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await fetchApi("/settings/product-card", {
        method: "PUT",
        body: JSON.stringify(config),
      });
      setConfig({ ...DEFAULT_PRODUCT_CARD_CONFIG, ...saved });
      window.dispatchEvent(new CustomEvent("routine:product-card-config", { detail: saved }));
      setLoadError("");
      showToast("Đã lưu cấu hình Product Card.", "success");
    } catch (error) {
      showToast(error.message || "Không thể lưu cấu hình.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Settings" subtitle="Cấu hình giao diện sản phẩm dùng chung" />
      <form className={styles.form} onSubmit={saveSettings}>
        <section className={styles.section}>
          <h2>Product Card</h2>
          <p>Áp dụng thống nhất trên trang chủ, danh mục và sản phẩm liên quan.</p>
          <label className={styles.field}>
            <span>Kiểu hiển thị</span>
            <select value={config.cardStyle} onChange={(event) => update("cardStyle", event.target.value)}>
              <option value="standard">Card tiêu chuẩn</option>
              <option value="sale">Card ưu đãi</option>
              <option value="minimal">Card tối giản</option>
              <option value="quick-buy">Card mua nhanh</option>
            </select>
          </label>
          <div className={styles.toggleGrid}>
            {DISPLAY_OPTIONS.map(([key, label]) => (
              <label className={styles.toggle} key={key}>
                <input type="checkbox" checked={Boolean(config[key])} onChange={(event) => update(key, event.target.checked)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Hình ảnh và lưới sản phẩm</h2>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Tỷ lệ ảnh</span>
              <select value={config.imageAspectRatio} onChange={(event) => update("imageAspectRatio", event.target.value)}>
                <option value="3 / 4">Dọc 3:4</option>
                <option value="1 / 1">Vuông 1:1</option>
                <option value="4 / 3">Ngang 4:3</option>
              </select>
            </label>
            {[
              ["columnsDesktop", "Số card desktop", 2, 6],
              ["columnsTablet", "Số card tablet", 2, 4],
              ["columnsMobile", "Số card mobile", 1, 2],
              ["gapDesktop", "Khoảng cách desktop (px)", 8, 48],
              ["gapMobile", "Khoảng cách mobile (px)", 4, 32],
            ].map(([key, label, min, max]) => (
              <label className={styles.field} key={key}>
                <span>{label}</span>
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={config[key]}
                  onChange={(event) => update(key, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
        </section>

        {loadError ? <p className={styles.error} role="alert">{loadError}</p> : null}
        <button className={styles.saveButton} type="submit" disabled={loading || saving}>
          {loading ? "Đang tải cấu hình…" : saving ? "Đang lưu…" : "Lưu cấu hình"}
        </button>
      </form>
    </div>
  );
}
