"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/ToastProvider";
import {
  fetchAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "@/lib/couponService";
import { formatPrice } from "@/lib/format";
import fieldStyles from "@/components/admin/selectors.module.css";
import styles from "./page.module.css";

export default function AdminVouchersPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null); // null = create
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    type: "percent",
    value: 10,
    minOrderValue: 200000,
    maxDiscount: 100000,
    description: "",
    isActive: true,
  });

  // Load coupons from Backend MySQL API
  async function loadCoupons() {
    setLoading(true);
    try {
      const list = await fetchAdminCoupons({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setCoupons(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load coupons:", err);
      showToast(err?.message || "Lỗi khi tải danh sách mã giảm giá", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, [statusFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadCoupons();
  }

  // Calculate KPIs
  const stats = useMemo(() => {
    const total = coupons.length;
    let activeCount = 0;
    let inactiveCount = 0;
    let percentCount = 0;
    let fixedCount = 0;
    let freeshipCount = 0;

    coupons.forEach((c) => {
      if (c.isActive) activeCount++;
      else inactiveCount++;

      if (c.type === "percent") percentCount++;
      else if (c.type === "fixed") fixedCount++;
      else if (c.type === "freeship") freeshipCount++;
    });

    return { total, activeCount, inactiveCount, percentCount, fixedCount, freeshipCount };
  }, [coupons]);

  // Client-side filtering for type
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
      return true;
    });
  }, [coupons, typeFilter]);

  // Copy code to clipboard
  function handleCopyCode(code) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast(`Đã sao chép mã "${code}" vào bộ nhớ tạm!`, "success");
    }
  }

  // Toggle active status
  async function handleToggleActive(coupon) {
    const nextActive = !coupon.isActive;
    try {
      await updateCoupon(coupon.code, { isActive: nextActive });
      setCoupons((prev) =>
        prev.map((c) => (c.code === coupon.code ? { ...c, isActive: nextActive } : c))
      );
      showToast(
        nextActive
          ? `Đã kích hoạt mã "${coupon.code}"`
          : `Đã tạm dừng mã "${coupon.code}"`,
        "success"
      );
    } catch (err) {
      showToast(err?.message || "Lỗi khi cập nhật trạng thái", "error");
    }
  }

  // Delete coupon
  async function handleDelete(code) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn mã giảm giá "${code}" khỏi MySQL?`)) {
      return;
    }
    try {
      await deleteCoupon(code);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      showToast(`Đã xóa mã giảm giá "${code}" thành công!`, "success");
    } catch (err) {
      showToast(err?.message || "Lỗi khi xóa mã giảm giá", "error");
    }
  }

  // Open Create Modal
  function openCreateModal() {
    setEditingCoupon(null);
    setFormData({
      code: "",
      type: "percent",
      value: 10,
      minOrderValue: 200000,
      maxDiscount: 100000,
      description: "",
      isActive: true,
    });
    setIsModalOpen(true);
  }

  // Open Edit Modal
  function openEditModal(coupon) {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type || "percent",
      value: coupon.value || 0,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || "",
      description: coupon.description || "",
      isActive: coupon.isActive ?? true,
    });
    setIsModalOpen(true);
  }

  // Save Modal (Create / Edit)
  async function handleSaveModal(e) {
    e.preventDefault();
    if (!formData.code.trim()) {
      showToast("Vui lòng nhập mã giảm giá", "error");
      return;
    }
    if (!formData.value || Number(formData.value) <= 0) {
      showToast("Giá trị giảm giá phải lớn hơn 0", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        description: formData.description.trim(),
        isActive: Boolean(formData.isActive),
      };

      if (editingCoupon) {
        const updated = await updateCoupon(editingCoupon.code, payload);
        const item = updated?.data || updated;
        setCoupons((prev) =>
          prev.map((c) => (c.code === editingCoupon.code ? { ...c, ...item } : c))
        );
        showToast(`Đã cập nhật mã "${editingCoupon.code}" thành công!`, "success");
      } else {
        const created = await createCoupon(payload);
        const item = created?.data || created;
        setCoupons((prev) => [item, ...prev]);
        showToast(`Đã tạo mã giảm giá "${payload.code}" thành công!`, "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err?.message || "Lỗi khi lưu mã giảm giá", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function getTypeBadge(type) {
    switch (type) {
      case "percent":
        return <span className={`${styles.typeBadge} ${styles.typePercent}`}>Giảm theo %</span>;
      case "fixed":
        return <span className={`${styles.typeBadge} ${styles.typeFixed}`}>Giảm tiền mặt</span>;
      case "freeship":
        return <span className={`${styles.typeBadge} ${styles.typeFreeship}`}>Miễn phí ship</span>;
      default:
        return <span className={styles.typeBadge}>{type}</span>;
    }
  }

  function formatDiscountText(coupon) {
    if (coupon.type === "percent") {
      return `Giảm ${coupon.value}%${coupon.maxDiscount ? ` (Tối đa ${formatPrice(coupon.maxDiscount)})` : ""}`;
    }
    if (coupon.type === "fixed") {
      return `Giảm ${formatPrice(coupon.value)}`;
    }
    if (coupon.type === "freeship") {
      return `Miễn phí vận chuyển (${formatPrice(coupon.value)})`;
    }
    return `Ưu đãi ${coupon.value}`;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Quản lý Mã giảm giá (Vouchers)"
        subtitle="Quản lý kho mã khuyến mãi, thiết lập điều kiện áp dụng, tỷ lệ giảm giá và trạng thái kích hoạt trên toàn hệ thống Routine"
        actions={
          <button
            type="button"
            className={styles.addBtn}
            onClick={openCreateModal}
          >
            ➕ Tạo mã giảm giá mới
          </button>
        }
      />

      {/* KPI STATS CARDS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>🎟️ Tổng số mã voucher</span>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statSub}>Được lưu trữ trong MySQL</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>✅ Đang kích hoạt</span>
          <span className={styles.statValue} style={{ color: "#059669" }}>
            {stats.activeCount}
          </span>
          <span className={styles.statSub}>Khách có thể nhập và áp dụng</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>⏸️ Đang tạm dừng</span>
          <span className={styles.statValue} style={{ color: "#b45309" }}>
            {stats.inactiveCount}
          </span>
          <span className={styles.statSub}>Tạm ngưng chương trình</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>📊 Phân loại mã</span>
          <span className={styles.statValue} style={{ fontSize: 18, color: "#1e293b", fontWeight: 600 }}>
            {stats.percentCount} % | {stats.fixedCount} VNĐ | {stats.freeshipCount} Ship
          </span>
          <span className={styles.statSub}>Đa dạng hình thức ưu đãi</span>
        </div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Tìm theo mã hoặc nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className={fieldStyles.button || styles.filterSelect}>
              Tìm kiếm
            </button>
          </form>

          <select
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Loại giảm giá: Tất cả</option>
            <option value="percent">Giảm theo %</option>
            <option value="fixed">Giảm số tiền cố định</option>
            <option value="freeship">Miễn phí vận chuyển (Freeship)</option>
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Trạng thái: Tất cả</option>
            <option value="ACTIVE">Đang bật (ACTIVE)</option>
            <option value="INACTIVE">Tạm ẩn (INACTIVE)</option>
          </select>
        </div>

        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Hiển thị {filteredCoupons.length} / {coupons.length} voucher
        </span>
      </div>

      {/* VOUCHERS GRID */}
      {loading ? (
        <p style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
          Đang nạp danh sách mã giảm giá từ MySQL…
        </p>
      ) : filteredCoupons.length === 0 ? (
        <div className={styles.statCard} style={{ textAlign: "center", padding: 48 }}>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            Không tìm thấy mã giảm giá nào phù hợp với bộ lọc.
          </p>
        </div>
      ) : (
        <div className={styles.vouchersGrid}>
          {filteredCoupons.map((coupon) => (
            <div key={coupon.code} className={styles.voucherCard}>
              {/* HEADER */}
              <div className={styles.voucherHeader}>
                <div className={styles.codeBadge}>
                  <span>{coupon.code}</span>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={() => handleCopyCode(coupon.code)}
                    title="Sao chép mã"
                  >
                    📋
                  </button>
                </div>
                {getTypeBadge(coupon.type)}
              </div>

              {/* BODY */}
              <div className={styles.voucherBody}>
                <div className={styles.discountHighlight}>
                  {formatDiscountText(coupon)}
                </div>

                <p className={styles.voucherDesc}>
                  {coupon.description || "Chưa có mô tả chi tiết chương trình."}
                </p>

                {/* CONDITIONS */}
                <div className={styles.conditionsList}>
                  <div className={styles.conditionItem}>
                    <span>🛒</span>
                    <span>
                      Đơn hàng tối thiểu:{" "}
                      <strong>
                        {coupon.minOrderValue > 0 ? formatPrice(coupon.minOrderValue) : "Không giới hạn"}
                      </strong>
                    </span>
                  </div>
                  {coupon.type === "percent" && coupon.maxDiscount && (
                    <div className={styles.conditionItem}>
                      <span>🏷️</span>
                      <span>
                        Mức giảm tối đa: <strong>{formatPrice(coupon.maxDiscount)}</strong>
                      </span>
                    </div>
                  )}
                  <div className={styles.conditionItem}>
                    <span>📅</span>
                    <span>
                      Ngày tạo: {new Date(coupon.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className={styles.voucherFooter}>
                <label className={styles.statusToggle}>
                  <div
                    className={`${styles.toggleSwitch} ${coupon.isActive ? styles.toggleSwitchActive : ""}`}
                    onClick={() => handleToggleActive(coupon)}
                  >
                    <div className={styles.toggleKnob} />
                  </div>
                  <span style={{ color: coupon.isActive ? "#059669" : "#64748b" }}>
                    {coupon.isActive ? "Đang bật" : "Tạm dừng"}
                  </span>
                </label>

                <div className={styles.footerActions}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => openEditModal(coupon)}
                    title="Chỉnh sửa mã voucher"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    onClick={() => handleDelete(coupon.code)}
                    title="Xóa mã voucher"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingCoupon ? `Chỉnh sửa mã: ${editingCoupon.code}` : "Tạo mã giảm giá mới"}
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
                {/* MÃ VOUCHER */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>
                    Mã giảm giá (Code) <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    className={fieldStyles.select}
                    required
                    disabled={Boolean(editingCoupon)}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "") })
                    }
                    placeholder="VD: ROUTINE20, FREESHIP..."
                    style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}
                  />
                  {editingCoupon && (
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                      Mã định danh không thể thay đổi sau khi tạo.
                    </span>
                  )}
                </div>

                {/* LOẠI GIẢM GIÁ */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>Hình thức giảm giá</label>
                  <select
                    className={fieldStyles.select}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="percent">Phần trăm (%) - Giảm theo % giá trị đơn</option>
                    <option value="fixed">Tiền mặt (VNĐ) - Giảm số tiền trực tiếp</option>
                    <option value="freeship">Miễn phí vận chuyển (Freeship)</option>
                  </select>
                </div>

                {/* GIÁ TRỊ GIẢM */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>
                    {formData.type === "percent"
                      ? "Phần trăm giảm (%) *"
                      : "Số tiền giảm (VNĐ) *"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={fieldStyles.select}
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === "percent" ? "VD: 10, 15, 20" : "VD: 50000, 100000"}
                  />
                </div>

                {/* MỨC GIẢM TỐI ĐA (CHỈ CHO PERCENT) */}
                {formData.type === "percent" && (
                  <div className={fieldStyles.field}>
                    <label className={fieldStyles.label}>Mức giảm tối đa (VNĐ)</label>
                    <input
                      type="number"
                      className={fieldStyles.select}
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      placeholder="VD: 100000 (để trống nếu không giới hạn)"
                    />
                  </div>
                )}

                {/* ĐƠN TỐI THIỂU */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>Giá trị đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    className={fieldStyles.select}
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    placeholder="VD: 300000 (để 0 nếu không yêu cầu)"
                  />
                </div>

                {/* MÔ TẢ */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>Mô tả chương trình khuyến mãi</label>
                  <textarea
                    className={fieldStyles.select}
                    rows={2}
                    style={{ resize: "vertical" }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="VD: Giảm 10% tối đa 100K cho đơn hàng từ 300K..."
                  />
                </div>

                {/* KÍCH HOẠT */}
                <div className={fieldStyles.field}>
                  <label className={fieldStyles.label}>Trạng thái kích hoạt</label>
                  <select
                    className={fieldStyles.select}
                    value={formData.isActive ? "1" : "0"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "1" })}
                  >
                    <option value="1">Kích hoạt ngay (Cho phép khách sử dụng)</option>
                    <option value="0">Tạm dừng (Khách không thể áp dụng)</option>
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
                  disabled={submitting}
                >
                  {submitting ? "Đang lưu…" : editingCoupon ? "Lưu thay đổi" : "Tạo mã voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
