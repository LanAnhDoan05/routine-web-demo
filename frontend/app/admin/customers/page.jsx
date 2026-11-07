"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import {
  IconCustomers,
  IconTikTok,
  IconFacebook,
  IconInstagram,
  IconLink,
} from "@/components/admin/icons";
import SocialLinkGeneratorModal from "@/components/admin/SocialLinkGeneratorModal";
import {
  fetchAdminCustomers,
  fetchGuestVisitors,
  updateCustomerStatus,
} from "@/lib/analyticsService";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/components/admin/ToastProvider";
import styles from "./page.module.css";

export default function CustomersPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("registered"); // 'registered' | 'guests'
  const [generatorOpen, setGeneratorOpen] = useState(false);

  // Dữ liệu khách hàng thành viên
  const [customers, setCustomers] = useState([]);
  const [custLoading, setCustLoading] = useState(true);
  const [custPlatformFilter, setCustPlatformFilter] = useState("ALL");
  const [custStatusFilter, setCustStatusFilter] = useState("ALL");
  const [custSearch, setCustSearch] = useState("");

  // Dữ liệu khách vãng lai
  const [guests, setGuests] = useState([]);
  const [guestLoading, setGuestLoading] = useState(true);
  const [guestPlatformFilter, setGuestPlatformFilter] = useState("ALL");
  const [guestSearch, setGuestSearch] = useState("");

  // Tải danh sách khách hàng thành viên
  const loadCustomers = () => {
    setCustLoading(true);
    fetchAdminCustomers({
      source: custPlatformFilter,
      status: custStatusFilter,
      search: custSearch,
      limit: 50,
    }).then((res) => {
      setCustomers(res?.items || []);
      setCustLoading(false);
    });
  };

  // Tải danh sách khách vãng lai
  const loadGuests = () => {
    setGuestLoading(true);
    fetchGuestVisitors({
      platform: guestPlatformFilter,
      search: guestSearch,
      limit: 50,
    }).then((res) => {
      setGuests(res?.items || []);
      setGuestLoading(false);
    });
  };

  useEffect(() => {
    loadCustomers();
  }, [custPlatformFilter, custStatusFilter]);

  useEffect(() => {
    loadGuests();
  }, [guestPlatformFilter]);

  const handleToggleCustomerStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      await updateCustomerStatus(id, nextStatus);
      showToast(
        nextStatus === "ACTIVE"
          ? "Đã mở khóa tài khoản khách hàng"
          : "Đã khóa tài khoản khách hàng",
        "success"
      );
      loadCustomers();
    } catch (err) {
      showToast(err.message || "Không thể cập nhật trạng thái", "error");
    }
  };

  const renderPlatformBadge = (platform) => {
    const p = String(platform || "ORGANIC").toUpperCase();
    if (p.includes("TIKTOK")) {
      return (
        <span className={`${styles.platformBadge} ${styles.badgeTiktok}`}>
          <IconTikTok size={12} />
          TikTok
        </span>
      );
    }
    if (p.includes("FACEBOOK")) {
      return (
        <span className={`${styles.platformBadge} ${styles.badgeFacebook}`}>
          <IconFacebook size={12} />
          Facebook
        </span>
      );
    }
    if (p.includes("INSTAGRAM")) {
      return (
        <span className={`${styles.platformBadge} ${styles.badgeInstagram}`}>
          <IconInstagram size={12} />
          Instagram
        </span>
      );
    }
    return (
      <span className={`${styles.platformBadge} ${styles.badgeOrganic}`}>
        Direct / Organic
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Quản Lý Khách Hàng & Hệ Sinh Thái"
        subtitle="Theo dõi người dùng đăng ký và các phiên khách vãng lai từ TikTok, Facebook, Instagram"
        actions={
          <button
            type="button"
            className={styles.generateBtn}
            onClick={() => setGeneratorOpen(true)}
          >
            <IconLink size={16} />
            <span>Tạo Link Tiếp Thị Sản Phẩm</span>
          </button>
        }
      />

      {/* Tabs chuyển đổi Thành viên vs Khách vãng lai */}
      <div className={styles.tabBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "registered" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("registered")}
        >
          <IconCustomers size={16} />
          <span>Khách Hàng Thành Viên</span>
          <span className={styles.badgeCount}>{customers.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "guests" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("guests")}
        >
          <span>👁️ Khách Vãng Lai (Guest Sessions)</span>
          <span className={styles.badgeCount}>{guests.length}</span>
        </button>
      </div>

      {/* ================= TAB 1: KHÁCH HÀNG THÀNH VIÊN ================= */}
      {activeTab === "registered" && (
        <>
          <div className={styles.filterCard}>
            <div className={styles.filterGroup}>
              <input
                type="text"
                placeholder="Tìm tên, email, SĐT..."
                className={styles.searchInput}
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadCustomers()}
              />
              <select
                className={styles.selectInput}
                value={custPlatformFilter}
                onChange={(e) => setCustPlatformFilter(e.target.value)}
              >
                <option value="ALL">Nguồn: Tất cả nền tảng</option>
                <option value="TIKTOK">Nguồn: TikTok</option>
                <option value="FACEBOOK">Nguồn: Facebook</option>
                <option value="INSTAGRAM">Nguồn: Instagram</option>
                <option value="ORGANIC">Nguồn: Tự nhiên / Direct</option>
              </select>
              <select
                className={styles.selectInput}
                value={custStatusFilter}
                onChange={(e) => setCustStatusFilter(e.target.value)}
              >
                <option value="ALL">Trạng thái: Tất cả</option>
                <option value="ACTIVE">Hoạt động (Active)</option>
                <option value="BLOCKED">Bị khóa (Blocked)</option>
              </select>
            </div>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={loadCustomers}
            >
              Làm mới ⟳
            </button>
          </div>

          <div className={styles.tableCard}>
            {custLoading ? (
              <p style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
                Đang tải danh sách khách hàng...
              </p>
            ) : customers.length === 0 ? (
              <EmptyState
                title="Chưa có khách hàng nào"
                message="Không tìm thấy khách hàng nào phù hợp với bộ lọc."
              />
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Khách Hàng</th>
                    <th>Nguồn Tiếp Cận</th>
                    <th>Số Đơn</th>
                    <th>Tổng Chi Tiêu (LTV)</th>
                    <th>Trạng Thái</th>
                    <th>Ngày Tham Gia</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.fullName}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {c.email} • {c.phoneNumber}
                          {(c.dateOfBirth || c.date) && ` • 🎂 ${c.dateOfBirth || c.date}`}
                        </div>
                      </td>
                      <td>{renderPlatformBadge(c.source)}</td>
                      <td style={{ fontWeight: 600 }}>{c.totalOrders || 0}</td>
                      <td style={{ fontWeight: 600, color: "#059669" }}>
                        {formatCurrency(c.totalSpent || 0)}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusTag} ${c.status === "ACTIVE" ? styles.statusActive : styles.statusBlocked}`}
                        >
                          {c.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>
                        {formatDate(c.createdAt)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() =>
                            handleToggleCustomerStatus(c.id, c.status)
                          }
                          style={{
                            color: c.status === "ACTIVE" ? "#b91c1c" : "#047857",
                          }}
                        >
                          {c.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ================= TAB 2: KHÁCH VÃNG LAI (GUEST SESSIONS) ================= */}
      {activeTab === "guests" && (
        <>
          <div className={styles.filterCard}>
            <div className={styles.filterGroup}>
              <input
                type="text"
                placeholder="Tìm mã session, tên sản phẩm..."
                className={styles.searchInput}
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadGuests()}
              />
              <select
                className={styles.selectInput}
                value={guestPlatformFilter}
                onChange={(e) => setGuestPlatformFilter(e.target.value)}
              >
                <option value="ALL">Nguồn: Tất cả nền tảng</option>
                <option value="TIKTOK">Nguồn: TikTok</option>
                <option value="FACEBOOK">Nguồn: Facebook</option>
                <option value="INSTAGRAM">Nguồn: Instagram</option>
                <option value="DIRECT">Nguồn: Direct</option>
              </select>
            </div>
            <button type="button" className={styles.actionBtn} onClick={loadGuests}>
              Làm mới ⟳
            </button>
          </div>

          <div className={styles.tableCard}>
            {guestLoading ? (
              <p style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
                Đang tải danh sách khách vãng lai...
              </p>
            ) : guests.length === 0 ? (
              <EmptyState
                title="Chưa có khách vãng lai nào"
                message="Chưa có phiên duyệt web nào được ghi nhận từ các liên kết tiếp thị."
              />
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã Phiên (Guest Session)</th>
                    <th>Nguồn Mạng Xã Hội</th>
                    <th>Sản Phẩm Quan Tâm</th>
                    <th>Lượt Click</th>
                    <th>Trạng Thái</th>
                    <th>Lần Ghé Thăm Cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g.guestSessionId}>
                      <td>
                        <code style={{ fontSize: 11, background: "#f3f4f6", padding: "3px 6px", borderRadius: 4 }}>
                          {g.guestSessionId}
                        </code>
                      </td>
                      <td>{renderPlatformBadge(g.platform)}</td>
                      <td>
                        {g.productsViewed && g.productsViewed.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {g.productsViewed.map((pv) => (
                              <div key={pv.id} className={styles.productThumb}>
                                {pv.image ? (
                                  <img src={pv.image} alt={pv.name} className={styles.productImg} />
                                ) : (
                                  <div className={styles.productImg} />
                                )}
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: 12 }}>{pv.name}</div>
                                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                                    {formatCurrency(pv.price)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: 12 }}>
                            Duyệt trang chung
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{g.totalClicks}</td>
                      <td>
                        {g.status === "CONVERTED" && (
                          <span className={`${styles.statusTag} ${styles.statusConverted}`}>
                            ✓ Đã mua hàng
                          </span>
                        )}
                        {g.status === "IN_CART" && (
                          <span className={`${styles.statusTag} ${styles.statusInCart}`}>
                            🛒 Có hàng trong giỏ
                          </span>
                        )}
                        {g.status === "BROWSING" && (
                          <span className={`${styles.statusTag} ${styles.statusBrowsing}`}>
                            👀 Đang xem
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>
                        {formatDate(g.lastSeen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Modal sinh link tiếp thị */}
      <SocialLinkGeneratorModal
        isOpen={generatorOpen}
        onClose={() => {
          setGeneratorOpen(false);
          loadGuests();
        }}
      />
    </div>
  );
}
