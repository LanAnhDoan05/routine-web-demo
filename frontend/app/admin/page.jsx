"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import {
  IconProducts,
  IconOrders,
  IconCustomers,
  IconArchive,
  IconTikTok,
  IconFacebook,
  IconInstagram,
  IconLink,
} from "@/components/admin/icons";
import SocialLinkGeneratorModal from "@/components/admin/SocialLinkGeneratorModal";
import { fetchAdminDashboard } from "@/lib/analyticsService";
import { formatCurrency, formatCompactNumber, formatDate, formatNumber } from "@/lib/format";
import styles from "./page.module.css";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    const data = await fetchAdminDashboard();
    if (data) {
      setDashboard(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const kpi = dashboard?.kpi;
  const ecosystem = dashboard?.socialEcosystem;
  const recentOrders = dashboard?.recentOrders || [];
  const topSelling = dashboard?.topSellingProducts || [];
  const lowStock = dashboard?.inventoryAlerts?.lowStock || [];
  const outOfStock = dashboard?.inventoryAlerts?.outOfStock || [];

  const tiktokData = ecosystem?.breakdown?.TIKTOK || { clicks: 0, guestCount: 0, ordersCount: 0, registeredCount: 0, revenue: 0 };
  const fbData = ecosystem?.breakdown?.FACEBOOK || { clicks: 0, guestCount: 0, ordersCount: 0, registeredCount: 0, revenue: 0 };
  const igData = ecosystem?.breakdown?.INSTAGRAM || { clicks: 0, guestCount: 0, ordersCount: 0, registeredCount: 0, revenue: 0 };

  return (
    <div>
      <PageHeader
        title="Dashboard Quản Trị"
        subtitle="Tổng quan kinh doanh, đơn hàng thực tế và hiệu quả tiếp thị mạng xã hội thời gian thực từ Database MySQL"
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className={styles.viewAllBtn}
              onClick={loadDashboardData}
              title="Làm mới dữ liệu từ Database"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <span>↻ Làm mới</span>
            </button>
            <button
              type="button"
              className={styles.viewAllBtn}
              onClick={() => setGeneratorOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", background: "#0f172a", color: "#fff", borderColor: "#0f172a" }}
            >
              <IconLink size={15} />
              <span>Tạo Link Tiếp Thị Mạng Xã Hội</span>
            </button>
          </div>
        }
      />

      {/* ================= THẺ CHỈ SỐ KPI CHÍNH ================= */}
      <div className={styles.statGrid}>
        <StatCard
          label="Tổng Doanh Thu"
          value={kpi ? formatCurrency(kpi.totalRevenue) : "—"}
          helper={kpi ? `Đã thanh toán: ${formatCurrency(kpi.paidRevenue)}` : undefined}
          icon={<IconOrders size={16} />}
          tone="success"
        />
        <StatCard
          label="Tổng Đơn Hàng"
          value={kpi ? formatNumber(kpi.totalOrders) : "—"}
          helper={kpi ? `${kpi.validOrders} thành công · ${kpi.statusBreakdown?.cancelled || 0} đã huỷ` : undefined}
          icon={<IconOrders size={16} />}
        />
        <StatCard
          label="Giá Trị Đơn TB (AOV)"
          value={kpi ? formatCurrency(kpi.averageOrderValue) : "—"}
          icon={<IconOrders size={16} />}
        />
        <StatCard
          label="Khách Hàng & Khách Vãng Lai"
          value={kpi ? formatNumber(kpi.totalCustomers) : "—"}
          helper={kpi ? `${kpi.totalCustomers} thành viên · ${kpi.totalGuests} khách vãng lai` : undefined}
          icon={<IconCustomers size={16} />}
        />
        <StatCard
          label="Sản Phẩm Trong Kho"
          value={kpi ? formatNumber(kpi.totalProducts) : "—"}
          helper={kpi ? `${kpi.activeProducts} còn hàng · ${kpi.lowStockProducts} sắp hết` : undefined}
          icon={<IconProducts size={16} />}
        />
        <StatCard
          label="Hết Hàng & Đánh Giá"
          value={kpi ? `${kpi.outOfStockProducts} hết hàng` : "—"}
          helper={kpi ? `⭐ ${kpi.averageRating}/5.0 (${kpi.totalReviews} lượt đánh giá)` : undefined}
          icon={<IconArchive size={16} />}
          tone={kpi && kpi.outOfStockProducts > 0 ? "danger" : undefined}
        />
      </div>

      {/* ================= HỆ SINH THÁI MẠNG XÃ HỘI (TIKTOK, FACEBOOK, INSTAGRAM) ================= */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Hệ Sinh Thái Mạng Xã Hội (Social Ecosystem Tracking)</h2>
            <p style={{ fontSize: 12.5, color: "var(--color-text-secondary)", marginTop: 2 }}>
              Dữ liệu truy cập thực tế theo bảng `traffic_logs`, thành viên mới từ nguồn mạng xã hội và đơn hàng chốt thành công
            </p>
          </div>
          <Link href="/admin/customers" className={styles.viewAllBtn}>
            Xem Khách Hàng & Khách Vãng Lai →
          </Link>
        </div>

        <div className={styles.socialGrid}>
          {/* TIKTOK */}
          <div className={`${styles.socialCard} ${styles.socialCardTiktok}`}>
            <div className={styles.socialCardHeader}>
              <div className={styles.socialTitle}>
                <IconTikTok size={18} />
                <span>TikTok Platform</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>
                CR: {tiktokData.clicks > 0 ? ((tiktokData.ordersCount / tiktokData.clicks) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className={styles.socialStatRows}>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Lượt Clicks</div>
                <div className={styles.socialStatValue}>{tiktokData.clicks}</div>
              </div>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Khách vãng lai</div>
                <div className={styles.socialStatValue}>{tiktokData.guestCount}</div>
              </div>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Đơn hàng tạo</div>
                <div className={styles.socialStatValue}>{tiktokData.ordersCount}</div>
              </div>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Thành viên mới</div>
                <div className={styles.socialStatValue}>{tiktokData.registeredCount || 0}</div>
              </div>
            </div>
            <div className={styles.socialRevenueBox}>
              <span className={styles.socialRevenueLabel}>Doanh thu TikTok</span>
              <span className={styles.socialRevenueVal}>{formatCurrency(tiktokData.revenue)}</span>
            </div>
          </div>

          {/* FACEBOOK */}
          <div className={`${styles.socialCard} ${styles.socialCardFacebook}`}>
            <div className={styles.socialCardHeader}>
              <div className={styles.socialTitle}>
                <IconFacebook size={18} />
                <span>Facebook Platform</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#1877f2" }}>
                CR: {fbData.clicks > 0 ? ((fbData.ordersCount / fbData.clicks) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className={styles.socialStatRows}>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Lượt Clicks</div>
                <div className={styles.socialStatValue}>{fbData.clicks}</div>
              </div>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Khách vãng lai</div>
                <div className={styles.socialStatValue}>{fbData.guestCount}</div>
              </div>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Đơn hàng tạo</div>
                <div className={styles.socialStatValue}>{fbData.ordersCount}</div>
              </div>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Thành viên mới</div>
                <div className={styles.socialStatValue}>{fbData.registeredCount || 0}</div>
              </div>
            </div>
            <div className={styles.socialRevenueBox}>
              <span className={styles.socialRevenueLabel}>Doanh thu Facebook</span>
              <span className={styles.socialRevenueVal}>{formatCurrency(fbData.revenue)}</span>
            </div>
          </div>

          {/* INSTAGRAM */}
          <div className={`${styles.socialCard} ${styles.socialCardInstagram}`}>
            <div className={styles.socialCardHeader}>
              <div className={styles.socialTitle}>
                <IconInstagram size={18} />
                <span>Instagram Platform</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#e1306c" }}>
                CR: {igData.clicks > 0 ? ((igData.ordersCount / igData.clicks) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className={styles.socialStatRows}>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Lượt Clicks</div>
                <div className={styles.socialStatValue}>{igData.clicks}</div>
              </div>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Khách vãng lai</div>
                <div className={styles.socialStatValue}>{igData.guestCount}</div>
              </div>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Đơn hàng tạo</div>
                <div className={styles.socialStatValue}>{igData.ordersCount}</div>
              </div>
              <div className={styles.socialStatBox}>
                <div className={styles.socialStatLabel}>Thành viên mới</div>
                <div className={styles.socialStatValue}>{igData.registeredCount || 0}</div>
              </div>
            </div>
            <div className={styles.socialRevenueBox}>
              <span className={styles.socialRevenueLabel}>Doanh thu Instagram</span>
              <span className={styles.socialRevenueVal}>{formatCurrency(igData.revenue)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DANH SÁCH 10 ĐƠN HÀNG MỚI NHẤT ================= */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Đơn Hàng Gần Đây ({recentOrders.length})</h2>
            <p style={{ fontSize: 12.5, color: "var(--color-text-secondary)", marginTop: 2 }}>
              Các đơn hàng mới nhất đặt qua hệ thống Routine Storefront
            </p>
          </div>
          <Link href="/orders" target="_blank" className={styles.viewAllBtn}>
            Xem Cổng Khách Hàng →
          </Link>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                  <th className={styles.actionCol}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--color-text-secondary)" }}>
                      Chưa có đơn hàng nào trong cơ sở dữ liệu.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className={styles.orderId}>#{order.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: 11.5, color: "var(--color-text-secondary)" }}>
                          {order.phoneNumber ? `${order.phoneNumber} · ` : ""}{order.customerEmail}
                        </div>
                      </td>
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }} title={order.itemsSummary}>
                        <span style={{ fontWeight: 500 }}>{order.itemsCount} sản phẩm</span>
                        <div style={{ fontSize: 11.5, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.itemsSummary || "—"}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--color-text)" }}>
                        {formatCurrency(order.total)}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: order.paymentStatus === "PAID" ? "#ecfdf5" : "#fef3c7", color: order.paymentStatus === "PAID" ? "#065f46" : "#92400e" }}>
                          {order.paymentMethod} · {order.paymentStatus === "PAID" ? "Đã trả" : "Chưa trả"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge value={order.orderStatus} />
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5 }}>{formatDate(order.createdAt)}</div>
                      </td>
                      <td className={styles.actionCol}>
                        <Link href={`/orders/${order.id}`} target="_blank" className={styles.linkBtn}>
                          Xem đơn
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= TỔNG QUAN SẢN PHẨM & TỒN KHO THỰC TẾ ================= */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Tổng Quan Sản Phẩm & Cảnh Báo Kho Hàng</h2>
            <p style={{ fontSize: 12.5, color: "var(--color-text-secondary)", marginTop: 2 }}>
              Top 5 sản phẩm bán chạy nhất tính từ các đơn hàng thực tế trong MySQL và cảnh báo số lượng tồn kho
            </p>
          </div>
          <Link href="/admin/products" className={styles.viewAllBtn}>
            Quản Lý Toàn Bộ Sản Phẩm →
          </Link>
        </div>

        <div className={styles.overviewGrid}>
          {/* Top Bán Chạy */}
          <ProductMiniList
            title="Top Sản Phẩm Bán Chạy Nhất"
            items={topSelling}
            emptyText="Chưa có dữ liệu bán hàng."
            showSales
          />

          {/* Sắp Hết Hàng */}
          <ProductMiniList
            title="Sắp Hết Hàng (Tồn kho ≤ 15)"
            items={lowStock}
            emptyText="Kho hàng ổn định, không có sản phẩm sắp hết."
            showStock
            badgeTone="warning"
          />

          {/* Hết Hàng */}
          <ProductMiniList
            title="Sản Phẩm Đã Hết Hàng (= 0)"
            items={outOfStock}
            emptyText="Tất cả sản phẩm đều còn hàng trong kho."
            showStock
            badgeTone="danger"
          />
        </div>
      </section>

      {/* Modal Tạo Link Tiếp Thị */}
      <SocialLinkGeneratorModal
        isOpen={generatorOpen}
        onClose={() => {
          setGeneratorOpen(false);
          loadDashboardData();
        }}
      />
    </div>
  );
}

function ProductMiniList({ title, items, emptyText, showStock, showSales, badgeTone }) {
  return (
    <div className={styles.miniListCard}>
      <h3 className={styles.miniListTitle}>{title}</h3>
      {items.length === 0 ? (
        <EmptyState title={emptyText} icon={<IconArchive size={18} />} />
      ) : (
        <ul className={styles.miniList}>
          {items.map((p) => (
            <li key={p.id} className={styles.miniItem}>
              <img src={p.image || "/images/products/men-tshirt-1.avif"} alt="" className={styles.miniThumb} />
              <div className={styles.miniInfo}>
                <Link href={`/product/${p.id}`} target="_blank" className={styles.miniName}>
                  {p.name}
                </Link>
                <span className={styles.miniMeta}>{p.categoryName || "Thời trang Routine"}</span>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {showSales ? (
                  <>
                    <span className={styles.miniValue} style={{ color: "#059669" }}>
                      {p.totalSold} đã bán
                    </span>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                      {formatCurrency(p.totalSales)}
                    </div>
                  </>
                ) : showStock ? (
                  <span
                    className={styles.miniValue}
                    style={{
                      color: badgeTone === "danger" ? "#dc2626" : "#d97706",
                      background: badgeTone === "danger" ? "#fef2f2" : "#fffbeb",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    còn {p.stockQuantity} sp
                  </span>
                ) : (
                  <span className={styles.miniValue}>{formatCurrency(p.price)}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
