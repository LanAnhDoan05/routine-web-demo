"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { useToast } from "@/components/admin/ToastProvider";
import {
  IconStores,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconMapPin,
  IconPhone,
  IconX,
  IconStar,
} from "@/components/admin/icons";
import {
  fetchAdminStores,
  fetchStoreStats,
  createStore,
  updateStore,
  toggleStoreStatus,
  deleteStore,
  resetDefaultStores,
} from "@/lib/storeService";
import styles from "./page.module.css";

const REGION_LABELS = {
  NORTH: "Miền Bắc",
  CENTRAL: "Miền Trung",
  SOUTH: "Miền Nam",
};

const INITIAL_FORM = {
  id: null,
  name: "",
  slug: "",
  address: "",
  city: "TP. Hồ Chí Minh",
  region: "SOUTH",
  phone: "1900 63 65 91",
  openingHours: "08:30 - 22:00",
  mapUrl: "",
  image: "",
  isFlagship: false,
  isActive: true,
};

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function StoresAdminPage() {
  const { showToast } = useToast();

  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Confirm modals
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Load stores & stats
  async function loadData() {
    setLoading(true);
    try {
      const [storesData, statsData] = await Promise.all([
        fetchAdminStores({
          region: regionFilter,
          city: cityFilter,
          status: statusFilter,
          search: search,
        }),
        fetchStoreStats(),
      ]);
      setStores(storesData || []);
      setStats(statsData || null);
    } catch (err) {
      console.error("Failed to load stores:", err);
      showToast(err.message || "Không thể tải danh sách cửa hàng", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionFilter, cityFilter, statusFilter]);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Unique list of cities from loaded stores
  const availableCities = useMemo(() => {
    const set = new Set();
    stores.forEach((s) => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set).sort();
  }, [stores]);

  // Open modal for Create
  function handleOpenCreate() {
    setFormData({ ...INITIAL_FORM, slug: "" });
    setIsModalOpen(true);
  }

  // Open modal for Edit
  function handleOpenEdit(store) {
    setFormData({
      id: store.id,
      name: store.name || "",
      slug: store.slug || "",
      address: store.address || "",
      city: store.city || "TP. Hồ Chí Minh",
      region: store.region || "SOUTH",
      phone: store.phone || "",
      openingHours: store.openingHours || "08:30 - 22:00",
      mapUrl: store.mapUrl || "",
      image: store.image || "",
      isFlagship: Boolean(store.isFlagship),
      isActive: Boolean(store.isActive),
    });
    setIsModalOpen(true);
  }

  // Name change auto fills slug if creating new
  function handleNameChange(e) {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: !prev.id ? slugify(val) : prev.slug,
    }));
  }

  // Submit create / update
  async function handleSubmitForm(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Vui lòng nhập tên cửa hàng", "error");
      return;
    }
    if (!formData.address.trim()) {
      showToast("Vui lòng nhập địa chỉ chi tiết", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (formData.id) {
        // Update
        await updateStore(formData.id, formData);
        showToast(`Đã cập nhật cửa hàng "${formData.name}" thành công!`, "success");
      } else {
        // Create
        await createStore(formData);
        showToast(`Đã thêm mới cửa hàng "${formData.name}" thành công!`, "success");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Save store error:", err);
      showToast(err.message || "Thao tác không thành công", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle active status
  async function handleToggleStatus(store) {
    try {
      await toggleStoreStatus(store.id);
      showToast(
        `Đã ${store.isActive ? "tạm ngưng" : "kích hoạt"} cửa hàng "${store.name}"`,
        "success"
      );
      await loadData();
    } catch (err) {
      showToast(err.message || "Không thể đổi trạng thái", "error");
    }
  }

  // Delete store
  async function handleConfirmDelete() {
    if (!storeToDelete) return;
    setDeleting(true);
    try {
      await deleteStore(storeToDelete.id);
      showToast(`Đã xóa cửa hàng "${storeToDelete.name}"`, "success");
      setStoreToDelete(null);
      await loadData();
    } catch (err) {
      showToast(err.message || "Không thể xóa cửa hàng", "error");
    } finally {
      setDeleting(false);
    }
  }

  // Reset default 25 stores
  async function handleConfirmResetDefaults() {
    setResetting(true);
    try {
      await resetDefaultStores();
      showToast("Hệ thống đã đồng bộ lại 25 cửa hàng Routine chính thức!", "success");
      setIsResetConfirmOpen(false);
      await loadData();
    } catch (err) {
      showToast(err.message || "Không thể khôi phục dữ liệu mẫu", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <PageHeader
        title="Quản lý cửa hàng Routine"
        subtitle="Quản lý mạng lưới 25 showroom và chi nhánh Routine trên toàn quốc"
        breadcrumb="Vận hành / Cửa hàng"
      />

      {/* KPI Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              <IconStores size={16} /> Tổng cửa hàng
            </div>
            <div className={styles.statValue}>{stats.total || 0}</div>
            <div className={styles.statSub}>
              {stats.active || 0} đang hoạt động • {stats.inactive || 0} tạm ngưng
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              <IconStar size={16} /> Flagship Store
            </div>
            <div className={styles.statValue}>{stats.flagship || 0}</div>
            <div className={styles.statSub}>Cửa hàng trải nghiệm chuẩn cao cấp</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Miền Bắc</div>
            <div className={styles.statValue}>{stats.north || 0}</div>
            <div className={styles.statSub}>Hà Nội, Hải Phòng, Lào Cai, Lạng Sơn...</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Miền Trung</div>
            <div className={styles.statValue}>{stats.central || 0}</div>
            <div className={styles.statSub}>Đà Nẵng, Gia Lai, Quảng Ngãi...</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Miền Nam</div>
            <div className={styles.statValue}>{stats.south || 0}</div>
            <div className={styles.statSub}>TP.HCM, Bình Dương, Vũng Tàu, Cà Mau...</div>
          </div>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <form onSubmit={handleSearchSubmit} className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <IconSearch size={16} />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm theo tên, địa chỉ, quận/huyện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          {/* Region filter */}
          <select
            className={styles.filterSelect}
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="ALL">Tất cả khu vực</option>
            <option value="NORTH">Miền Bắc</option>
            <option value="CENTRAL">Miền Trung</option>
            <option value="SOUTH">Miền Nam</option>
          </select>

          {/* City filter */}
          <select
            className={styles.filterSelect}
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="ALL">Tất cả tỉnh / thành</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm ngưng</option>
          </select>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => setIsResetConfirmOpen(true)}
            title="Đồng bộ lại danh sách 25 cửa hàng gốc Routine"
          >
            Khôi phục mặc định
          </button>

          <button
            type="button"
            className={styles.addBtn}
            onClick={handleOpenCreate}
          >
            <IconPlus size={16} /> Thêm cửa hàng
          </button>
        </div>
      </div>

      {/* Stores Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>Đang tải danh sách cửa hàng...</div>
        ) : stores.length === 0 ? (
          <div className={styles.loadingState}>
            Không tìm thấy cửa hàng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "26%" }}>Tên cửa hàng</th>
                  <th style={{ width: "15%" }}>Khu vực & Tỉnh/Thành</th>
                  <th style={{ width: "29%" }}>Địa chỉ</th>
                  <th style={{ width: "16%" }}>Liên hệ / Giờ mở cửa</th>
                  <th style={{ width: "10%" }}>Trạng thái</th>
                  <th style={{ width: "14%", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td>
                      <div className={styles.storeInfo}>
                        <div className={styles.storeName}>
                          {store.name}
                          {store.isFlagship && (
                            <span className={styles.flagshipBadge}>Flagship</span>
                          )}
                        </div>
                        <span className={styles.storeSlug}>/{store.slug}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div>
                          <span
                            className={`${styles.regionBadge} ${
                              store.region === "NORTH"
                                ? styles.regionNorth
                                : store.region === "CENTRAL"
                                ? styles.regionCentral
                                : styles.regionSouth
                            }`}
                          >
                            {REGION_LABELS[store.region] || store.region}
                          </span>
                        </div>
                        <small style={{ color: "#64748b", fontWeight: 500 }}>
                          {store.city}
                        </small>
                      </div>
                    </td>

                    <td>
                      <div className={styles.addressText} title={store.address}>
                        {store.address}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12.5 }}>
                        <span style={{ color: "#334155", display: "flex", alignItems: "center", gap: 4 }}>
                          <IconPhone size={13} /> {store.phone || "Chưa cập nhật"}
                        </span>
                        <span style={{ color: "#64748b" }}>
                          {store.openingHours || "08:30 - 22:00"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(store)}
                        className={`${styles.statusSwitch} ${
                          store.isActive ? styles.statusActive : styles.statusInactive
                        }`}
                        title="Bấm để chuyển đổi trạng thái"
                      >
                        {store.isActive ? "● Hoạt động" : "○ Tạm ngưng"}
                      </button>
                    </td>

                    <td>
                      <div className={styles.actionBtns} style={{ justifyContent: "flex-end" }}>
                        {store.mapUrl && (
                          <a
                            href={store.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.iconBtn} ${styles.mapBtn}`}
                            title="Xem vị trí trên Google Maps"
                          >
                            <IconMapPin size={15} />
                          </a>
                        )}

                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => handleOpenEdit(store)}
                          title="Chỉnh sửa thông tin"
                        >
                          <IconEdit size={15} />
                        </button>

                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          onClick={() => setStoreToDelete(store)}
                          title="Xóa cửa hàng"
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Store */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {formData.id ? "Chỉnh sửa thông tin cửa hàng" : "Thêm mới cửa hàng Routine"}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  {/* Name */}
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.formLabel}>Tên cửa hàng *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Ví dụ: Routine Lê Lợi"
                      value={formData.name}
                      onChange={handleNameChange}
                      required
                    />
                  </div>

                  {/* Slug */}
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.formLabel}>Đường dẫn tĩnh (Slug)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="routine-le-loi"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, slug: e.target.value }))
                      }
                    />
                  </div>

                  {/* Region */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Khu vực *</label>
                    <select
                      className={styles.formSelect}
                      value={formData.region}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, region: e.target.value }))
                      }
                      required
                    >
                      <option value="NORTH">Miền Bắc</option>
                      <option value="CENTRAL">Miền Trung</option>
                      <option value="SOUTH">Miền Nam</option>
                    </select>
                  </div>

                  {/* City */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tỉnh / Thành phố *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội..."
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, city: e.target.value }))
                      }
                      required
                    />
                  </div>

                  {/* Address */}
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.formLabel}>Địa chỉ chi tiết *</label>
                    <textarea
                      className={styles.formTextarea}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, address: e.target.value }))
                      }
                      rows={2}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số điện thoại hotline</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="1900 63 65 91"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>

                  {/* Opening Hours */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Giờ mở cửa</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="08:30 - 22:00"
                      value={formData.openingHours}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, openingHours: e.target.value }))
                      }
                    />
                  </div>

                  {/* Google Map URL */}
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.formLabel}>Đường dẫn Google Maps</label>
                    <input
                      type="url"
                      className={styles.formInput}
                      placeholder="https://maps.google.com/?q=..."
                      value={formData.mapUrl}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, mapUrl: e.target.value }))
                      }
                    />
                  </div>

                  {/* Checkbox Options */}
                  <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: 6, display: "flex", gap: 24 }}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={formData.isFlagship}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, isFlagship: e.target.checked }))
                        }
                      />
                      <span>Cửa hàng Flagship Store</span>
                    </label>

                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, isActive: e.target.checked }))
                        }
                      />
                      <span>Đang hoạt động</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? "Đang lưu..." : formData.id ? "Cập nhật" : "Tạo cửa hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(storeToDelete)}
        title="Xác nhận xóa cửa hàng"
        description={`Bạn có chắc chắn muốn xóa cửa hàng "${storeToDelete?.name}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa cửa hàng"
        cancelLabel="Hủy"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setStoreToDelete(null)}
      />

      {/* Reset Defaults Confirmation Modal */}
      <ConfirmModal
        open={isResetConfirmOpen}
        title="Khôi phục danh sách cửa hàng mặc định"
        description="Hệ thống sẽ đồng bộ lại toàn bộ 25 chi nhánh Routine chính thức (Bắc, Trung, Nam) vào cơ sở dữ liệu. Bạn có muốn tiếp tục?"
        confirmLabel="Khôi phục 25 cửa hàng"
        cancelLabel="Hủy"
        tone="neutral"
        loading={resetting}
        onConfirm={handleConfirmResetDefaults}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
