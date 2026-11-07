"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import ImageUploader from "@/components/admin/ImageUploader";
import { useToast } from "@/components/admin/ToastProvider";
import { getHeroBanners, updateHeroBanners } from "@/lib/settingService";
import {
  getStyles,
  createStyle,
  updateStyle,
  deleteStyle,
} from "@/lib/styleService";
import { uploadImageFile } from "@/lib/uploadService";
import fieldStyles from "@/components/admin/selectors.module.css";
import styles from "./page.module.css";

function normalizeImages(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item, idx) => {
      if (typeof item === "string") {
        return {
          id: `img-${idx}-${Date.now().toString(36)}`,
          url: item,
          isPrimary: idx === 0,
          displayOrder: idx + 1,
        };
      }
      return {
        id: item.id || `img-${idx}`,
        url: item.url || item.image || "",
        isPrimary: item.isPrimary ?? idx === 0,
        displayOrder: item.displayOrder ?? idx + 1,
      };
    })
    .filter((img) => Boolean(img.url));
}

export default function BannersPage() {
  const { showToast } = useToast();

  // Tab navigation
  const [activeTab, setActiveTab] = useState("hero"); // 'hero' | 'styles'

  // ==================== HERO BANNERS STATE ====================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState([]);
  const [slideInterval, setSlideInterval] = useState(2500);
  const [title, setTitle] = useState("STYLE THAT FITS YOU");
  const [subtitle, setSubtitle] = useState(
    "Khám phá phong cách phù hợp với bạn.\nThời trang không chỉ là mặc gì. Đó là cách bạn thể hiện chính mình."
  );

  // ==================== STYLES MANAGEMENT STATE ====================
  const [stylesList, setStylesList] = useState([]);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [styleFilter, setStyleFilter] = useState("ALL"); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [quickUploadingId, setQuickUploadingId] = useState(null);

  // Modal create/edit style state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null); // null = Create, object = Edit
  const [modalForm, setModalForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    status: "ACTIVE",
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalImageUploading, setModalImageUploading] = useState(false);

  const quickFileInputRef = useRef(null);
  const quickTargetStyleIdRef = useRef(null);
  const modalFileInputRef = useRef(null);

  // Load Hero Banners
  useEffect(() => {
    getHeroBanners().then((data) => {
      if (data) {
        const list =
          Array.isArray(data.banners) && data.banners.length > 0
            ? data.banners
            : Array.isArray(data.rightImages) && data.rightImages.length > 0
            ? data.rightImages
            : [
                { id: "hb-1", url: "/images/hero/hero-banner-1.svg", isPrimary: true },
                { id: "hb-2", url: "/images/hero/hero-banner-2.svg", isPrimary: false },
                { id: "hb-3", url: "/images/hero/hero-banner-3.svg", isPrimary: false },
              ];
        setBanners(normalizeImages(list));
        if (data.slideInterval) setSlideInterval(data.slideInterval);
        if (data.title) setTitle(data.title);
        if (data.subtitle) setSubtitle(data.subtitle);
      }
      setLoading(false);
    });
  }, []);

  // Load Styles list
  async function fetchStylesData() {
    setStylesLoading(true);
    try {
      const res = await getStyles();
      setStylesList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load styles:", err);
      showToast("Không thể tải danh sách phong cách: " + err.message, "error");
    } finally {
      setStylesLoading(false);
    }
  }

  useEffect(() => {
    fetchStylesData();
  }, []);

  // ==================== HERO BANNERS SAVE ====================
  async function handleSaveHero() {
    setSaving(true);
    try {
      const payload = {
        banners: banners.map((img) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary,
        })),
        slideInterval,
        title,
        subtitle,
      };
      await updateHeroBanners(payload);
      showToast("Đã lưu cấu hình Banner & Hero trang chủ thành công!", "success");
    } catch (err) {
      showToast(err?.message || "Lỗi khi lưu cài đặt", "error");
    } finally {
      setSaving(false);
    }
  }

  // ==================== QUICK IMAGE UPLOAD FOR STYLE ====================
  function triggerQuickPhotoUpload(styleId) {
    quickTargetStyleIdRef.current = styleId;
    if (quickFileInputRef.current) {
      quickFileInputRef.current.value = "";
      quickFileInputRef.current.click();
    }
  }

  async function handleQuickFileChange(e) {
    const file = e.target.files?.[0];
    const targetId = quickTargetStyleIdRef.current;
    if (!file || !targetId) return;

    setQuickUploadingId(targetId);
    try {
      showToast("Đang tải ảnh lên máy chủ...", "info");
      const uploadedUrl = await uploadImageFile(file);
      await updateStyle(targetId, { image: uploadedUrl });
      setStylesList((prev) =>
        prev.map((s) => (s.id === targetId ? { ...s, image: uploadedUrl, imageUrl: uploadedUrl } : s))
      );
      showToast("Đã cập nhật ảnh phong cách thành công!", "success");
    } catch (err) {
      console.error("Upload error:", err);
      showToast(err?.message || "Lỗi khi tải ảnh", "error");
    } finally {
      setQuickUploadingId(null);
    }
  }

  // Toggle style status
  async function handleToggleStatus(style) {
    const nextStatus = style.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateStyle(style.id, { status: nextStatus });
      setStylesList((prev) =>
        prev.map((s) => (s.id === style.id ? { ...s, status: nextStatus } : s))
      );
      showToast(
        nextStatus === "ACTIVE"
          ? `Đã bật hiển thị phong cách "${style.name}"`
          : `Đã tạm ẩn phong cách "${style.name}"`,
        "success"
      );
    } catch (err) {
      showToast(err?.message || "Lỗi khi cập nhật trạng thái", "error");
    }
  }

  // Delete style
  async function handleDeleteStyle(style) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa phong cách "${style.name}" không? Hành động này không thể hoàn tác.`
    );
    if (!confirmed) return;

    try {
      await deleteStyle(style.id);
      setStylesList((prev) => prev.filter((s) => s.id !== style.id));
      showToast(`Đã xóa phong cách "${style.name}" thành công!`, "success");
    } catch (err) {
      showToast(err?.message || "Lỗi khi xóa phong cách", "error");
    }
  }

  // ==================== MODAL CREATE / EDIT ====================
  function openCreateModal() {
    setEditingStyle(null);
    setModalForm({
      name: "",
      slug: "",
      description: "",
      image: "/images/styles/basic.jpg",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  }

  function openEditModal(style) {
    setEditingStyle(style);
    setModalForm({
      name: style.name || "",
      slug: style.slug || "",
      description: style.description || "",
      image: style.image || style.imageUrl || "/images/styles/basic.jpg",
      status: style.status || "ACTIVE",
    });
    setIsModalOpen(true);
  }

  async function handleModalFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setModalImageUploading(true);
    try {
      const uploadedUrl = await uploadImageFile(file);
      setModalForm((prev) => ({ ...prev, image: uploadedUrl }));
      showToast("Tải ảnh lên máy chủ thành công!", "success");
    } catch (err) {
      showToast(err?.message || "Lỗi khi tải ảnh", "error");
    } finally {
      setModalImageUploading(false);
    }
  }

  async function handleSaveModal(e) {
    e.preventDefault();
    if (!modalForm.name.trim()) {
      showToast("Vui lòng nhập tên phong cách", "error");
      return;
    }

    setModalSubmitting(true);
    try {
      if (editingStyle) {
        // Edit existing
        const updated = await updateStyle(editingStyle.id, {
          name: modalForm.name.trim(),
          slug: modalForm.slug.trim() || undefined,
          description: modalForm.description.trim(),
          image: modalForm.image,
          status: modalForm.status,
        });
        const saved = updated?.data || updated;
        setStylesList((prev) =>
          prev.map((s) => (s.id === editingStyle.id ? { ...s, ...saved } : s))
        );
        showToast("Đã cập nhật phong cách thành công!", "success");
      } else {
        // Create new
        const created = await createStyle({
          name: modalForm.name.trim(),
          slug: modalForm.slug.trim() || undefined,
          description: modalForm.description.trim(),
          image: modalForm.image,
          status: modalForm.status,
        });
        const saved = created?.data || created;
        setStylesList((prev) => [saved, ...prev]);
        showToast("Đã thêm phong cách mới thành công!", "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err?.message || "Lỗi khi lưu phong cách", "error");
    } finally {
      setModalSubmitting(false);
    }
  }

  if (loading) {
    return <p style={{ padding: 32, color: "var(--color-text-secondary)" }}>Đang tải cài đặt…</p>;
  }

  // Filtered styles
  const filteredStyles = stylesList.filter((item) => {
    if (styleFilter === "ACTIVE") return item.status === "ACTIVE";
    if (styleFilter === "INACTIVE") return item.status === "INACTIVE";
    return true;
  });

  return (
    <div className={styles.container}>
      {/* HIDDEN INPUT FOR QUICK PHOTO REPLACEMENT */}
      <input
        ref={quickFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleQuickFileChange}
      />

      {/* TOP TABS NAVIGATION */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "hero" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("hero")}
        >
          🖼️ Banners & Hero Trang Chủ
          <span className={styles.tabBadge}>{banners.length} ảnh</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "styles" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("styles")}
        >
          🎨 Ảnh Phong Cách Đăng Ký (/register/style)
          <span className={styles.tabBadge}>{stylesList.length} phong cách</span>
        </button>
      </div>

      {/* TAB 1: HERO BANNERS SETTINGS */}
      {activeTab === "hero" && (
        <>
          <PageHeader
            title="Banners & Hero Trang chủ"
            subtitle="Quản lý toàn bộ hình ảnh và hiệu ứng tự động chuyển ảnh (2-3s) cho banner trang chủ"
            actions={
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleSaveHero}
                disabled={saving}
              >
                {saving ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            }
          />

          {/* INTERVAL SLIDER SETTING */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                ⏱️ Tốc độ chuyển ảnh tự động (Auto-Slide Interval)
                <span className={`${styles.badge} ${styles.badgeActive}`}>
                  Tự động chuyển mỗi {slideInterval / 1000}s
                </span>
              </h3>
              <p className={styles.cardSubtitle}>
                Chọn khoảng thời gian mỗi banner hiển thị trên trang chủ trước khi tự động chuyển sang ảnh tiếp theo (tần 2 - 3 giây)
              </p>
            </div>
            <div className={styles.intervalSelector}>
              {[2000, 2500, 3000, 3500, 4000].map((ms) => (
                <button
                  key={ms}
                  type="button"
                  className={`${styles.intervalBtn} ${slideInterval === ms ? styles.intervalBtnActive : ""}`}
                  onClick={() => setSlideInterval(ms)}
                >
                  {ms / 1000} giây {ms === 2500 ? "(Chuẩn Routine)" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* BANNER CONTENT (TITLE & SUBTITLE) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>✍️ Nội dung chữ trên Banner</h3>
              <p className={styles.cardSubtitle}>
                Văn bản hiển thị nổi bật phía trên banner chuyển động
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className={fieldStyles.field}>
                <label className={fieldStyles.label}>Tiêu đề chính (Banner Title)</label>
                <input
                  className={fieldStyles.select}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="STYLE THAT FITS YOU"
                />
              </div>

              <div className={fieldStyles.field}>
                <label className={fieldStyles.label}>Mô tả phụ (Banner Subtitle)</label>
                <textarea
                  className={fieldStyles.select}
                  rows={2}
                  style={{ resize: "vertical" }}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* UNIFIED HERO BANNERS UPLOADER */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                🖼️ Danh sách Hình ảnh Banner Trang chủ
                <span className={styles.badge}>{banners.length} ảnh trong slide</span>
              </h3>
              <p className={styles.cardSubtitle}>
                Tải lên nhiều ảnh banner toàn màn hình. Hệ thống sẽ tự động tạo hiệu ứng chuyển động mượt mà giữa các ảnh này.
              </p>
            </div>

            <div className={styles.fieldGroup}>
              <ImageUploader images={banners} onChange={setBanners} />
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                💡 <strong>Hướng dẫn:</strong> Bạn có thể tải lên nhiều ảnh từ máy tính (JPG, PNG, WEBP, SVG), kéo thả để sắp xếp thứ tự hiển thị, hoặc bấm vào biểu tượng ngôi sao để chọn ảnh xuất hiện đầu tiên khi khách vào trang chủ.
              </p>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: STYLES / PHONG CÁCH ĐĂNG KÝ */}
      {activeTab === "styles" && (
        <>
          <PageHeader
            title="Ảnh Phong Cách Đăng Ký (/register/style)"
            subtitle="Quản lý hình ảnh và phong cách thời trang Routine gợi ý cho khách hàng lựa chọn khi hoàn tất nhập thông tin tài khoản."
            actions={
              <div style={{ display: "flex", gap: 10 }}>
                <Link
                  href="/register/style"
                  target="_blank"
                  className={styles.previewLinkBtn}
                  title="Mở giao diện đăng ký để xem trước trải nghiệm của khách hàng"
                >
                  👁️ Xem trước trang đăng ký ↗
                </Link>
                <button
                  type="button"
                  className={styles.addStyleBtn}
                  onClick={openCreateModal}
                >
                  ➕ Thêm phong cách mới
                </button>
              </div>
            }
          />

          {/* TOOLBAR: FILTER & STATS */}
          <div className={styles.sectionToolbar}>
            <div className={styles.toolbarLeft}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                Bộ lọc trạng thái:
              </span>
              <div className={styles.filterTabs}>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${styleFilter === "ALL" ? styles.filterBtnActive : ""}`}
                  onClick={() => setStyleFilter("ALL")}
                >
                  Tất cả ({stylesList.length})
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${styleFilter === "ACTIVE" ? styles.filterBtnActive : ""}`}
                  onClick={() => setStyleFilter("ACTIVE")}
                >
                  Đang hiển thị ({stylesList.filter((s) => s.status === "ACTIVE").length})
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${styleFilter === "INACTIVE" ? styles.filterBtnActive : ""}`}
                  onClick={() => setStyleFilter("INACTIVE")}
                >
                  Tạm ẩn ({stylesList.filter((s) => s.status === "INACTIVE").length})
                </button>
              </div>
            </div>

            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              💡 Bấm vào nút <strong>&quot;Đổi ảnh&quot;</strong> trên từng thẻ để thay ảnh trực tiếp từ máy tính
            </span>
          </div>

          {/* STYLES GRID */}
          {stylesLoading ? (
            <p style={{ padding: 24, color: "var(--color-text-secondary)" }}>Đang tải danh sách phong cách…</p>
          ) : filteredStyles.length === 0 ? (
            <div className={styles.card} style={{ textAlign: "center", padding: 48 }}>
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                Không có phong cách nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className={styles.stylesGrid}>
              {filteredStyles.map((item) => {
                const isActive = item.status === "ACTIVE";
                const isQuickUploading = quickUploadingId === item.id;
                const imgSrc = item.image || item.imageUrl || "/images/styles/basic.jpg";

                return (
                  <div key={item.id} className={styles.styleCard}>
                    {/* MEDIA HEADER */}
                    <div className={styles.styleCardHeader}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgSrc}
                        alt={item.name}
                        className={styles.styleCardThumb}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/styles/basic.jpg";
                        }}
                      />

                      {/* STATUS BADGE */}
                      <span
                        className={`${styles.statusBadge} ${
                          isActive ? styles.statusBadgeActive : styles.statusBadgeInactive
                        }`}
                      >
                        {isActive ? "HIỂN THỊ" : "ĐÃ ẨN"}
                      </span>

                      {/* HOVER OVERLAY WITH CHANGE PHOTO BUTTON */}
                      <div className={styles.styleCardOverlay}>
                        <button
                          type="button"
                          className={styles.changePhotoBtn}
                          onClick={() => triggerQuickPhotoUpload(item.id)}
                          disabled={isQuickUploading}
                        >
                          📷 {isQuickUploading ? "Đang tải ảnh lên…" : "Đổi ảnh từ máy"}
                        </button>
                      </div>
                    </div>

                    {/* BODY */}
                    <div className={styles.styleCardBody}>
                      <div className={styles.styleCardTitleRow}>
                        <h4 className={styles.styleName}>{item.name}</h4>
                        <span className={styles.styleSlug}>#{item.slug}</span>
                      </div>

                      <p className={styles.styleDesc}>
                        {item.description || "Chưa có mô tả ngắn."}
                      </p>

                      {/* FOOTER ACTIONS */}
                      <div className={styles.styleCardFooter}>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${
                            isActive ? styles.toggleBtnActive : styles.toggleBtnInactive
                          }`}
                          onClick={() => handleToggleStatus(item)}
                          title={isActive ? "Bấm để tạm ẩn khỏi trang đăng ký" : "Bấm để kích hoạt hiển thị"}
                        >
                          {isActive ? "Tạm ẩn" : "Kích hoạt"}
                        </button>

                        <div className={styles.footerActions}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => openEditModal(item)}
                            title="Sửa thông tin phong cách"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => handleDeleteStyle(item)}
                            title="Xóa phong cách"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingStyle ? `Chỉnh sửa: ${editingStyle.name}` : "Thêm phong cách mới"}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className={styles.modalBody}>
                {/* TÊN PHONG CÁCH */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>
                    Tên phong cách <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    className={fieldStyles.select}
                    required
                    value={modalForm.name}
                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                    placeholder="VD: Smart Casual, Vintage, Old Money..."
                  />
                </div>

                {/* SLUG */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>
                    Slug (Đường dẫn tĩnh định danh)
                  </label>
                  <input
                    className={fieldStyles.select}
                    value={modalForm.slug}
                    onChange={(e) => setModalForm({ ...modalForm, slug: e.target.value })}
                    placeholder="VD: smart-casual (để trống sẽ tự tạo theo tên)"
                  />
                </div>

                {/* MÔ TẢ */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>Mô tả ngắn gọn</label>
                  <textarea
                    className={fieldStyles.select}
                    rows={2}
                    style={{ resize: "vertical" }}
                    value={modalForm.description}
                    onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                    placeholder="VD: Lịch sự vừa đủ, vẫn thoải mái để di chuyển cả ngày."
                  />
                </div>

                {/* HÌNH ẢNH */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>Hình ảnh đại diện phong cách</label>
                  <div className={styles.photoPreviewWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={modalForm.image || "/images/styles/basic.jpg"}
                      alt="Preview"
                      className={styles.previewThumb}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/styles/basic.jpg";
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className={styles.uploadTriggerBtn}
                          onClick={() => modalFileInputRef.current?.click()}
                          disabled={modalImageUploading}
                        >
                          📁 {modalImageUploading ? "Đang tải ảnh..." : "Chọn ảnh từ máy tính"}
                        </button>
                        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                          Hỗ trợ JPG, PNG, WEBP
                        </span>
                      </div>
                      <input
                        ref={modalFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleModalFileUpload}
                      />
                      <input
                        className={fieldStyles.select}
                        value={modalForm.image}
                        onChange={(e) => setModalForm({ ...modalForm, image: e.target.value })}
                        placeholder="Hoặc dán trực tiếp đường dẫn URL ảnh tại đây"
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>

                {/* TRẠNG THÁI */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>Trạng thái hiển thị</label>
                  <select
                    className={fieldStyles.select}
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">Kích hoạt (Hiển thị cho khách khi đăng ký)</option>
                    <option value="INACTIVE">Tạm ẩn (Không hiển thị)</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={modalSubmitting || modalImageUploading}
                >
                  {modalSubmitting ? "Đang lưu…" : editingStyle ? "Lưu thay đổi" : "Thêm mới phong cách"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
