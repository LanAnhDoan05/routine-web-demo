"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/ToastProvider";
import {
  fetchAdminOrders,
  fetchAdminOrderById,
  updateAdminOrderStatus,
  sendAdminOrderInvoice,
} from "@/lib/adminOrderService";
import { formatPrice } from "@/lib/format";
import styles from "./page.module.css";

const ORDER_STATUS_LABELS = {
  PENDING: "Chờ duyệt",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  // Load orders from Backend MySQL API
  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetchAdminOrders({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: searchQuery || undefined,
        limit: 100,
      });
      setOrders(res?.items || []);
    } catch (err) {
      console.error("Failed to load admin orders:", err);
      showToast(err?.message || "Lỗi khi tải danh sách đơn hàng", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadOrders();
  }

  // Calculate KPIs
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    let totalRevenue = 0;
    let confirmedCount = 0;
    let shippingCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let memberCount = 0;
    let guestCount = 0;

    orders.forEach((o) => {
      const st = (o.orderStatus || o.status || "").toUpperCase();
      if (st !== "CANCELLED") {
        totalRevenue += Number(o.total || 0);
      }
      if (st === "CONFIRMED" || st === "PENDING") confirmedCount++;
      else if (st === "SHIPPING") shippingCount++;
      else if (st === "DELIVERED") deliveredCount++;
      else if (st === "CANCELLED") cancelledCount++;

      if (o.userId || o.user) {
        memberCount++;
      } else {
        guestCount++;
      }
    });

    return {
      totalOrders,
      totalRevenue,
      confirmedCount,
      shippingCount,
      deliveredCount,
      cancelledCount,
      memberCount,
      guestCount,
    };
  }, [orders]);

  // Client-side filtering for payment, source & customer type
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (paymentFilter !== "ALL") {
        const pMethod = (o.paymentMethod || "").toUpperCase();
        if (pMethod !== paymentFilter) return false;
      }
      if (sourceFilter !== "ALL") {
        const src = (o.attributionSource || o.user?.source || "ORGANIC").toUpperCase();
        if (src !== sourceFilter) return false;
      }
      if (customerTypeFilter !== "ALL") {
        const isMem = !!(o.userId || o.user);
        if (customerTypeFilter === "MEMBER" && !isMem) return false;
        if (customerTypeFilter === "GUEST" && isMem) return false;
      }
      return true;
    });
  }, [orders, paymentFilter, sourceFilter, customerTypeFilter]);

  // Handle quick status change
  async function handleQuickStatusChange(orderId, newStatus) {
    try {
      const paymentUpdate = newStatus === "DELIVERED" ? "PAID" : null;
      const updated = await updateAdminOrderStatus(orderId, newStatus, paymentUpdate);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, ...updated }));
      }
      showToast(`Đã cập nhật đơn hàng ${orderId} sang "${ORDER_STATUS_LABELS[newStatus] || newStatus}"`, "success");
    } catch (err) {
      showToast(err?.message || "Lỗi cập nhật trạng thái đơn hàng", "error");
    }
  }

  // Open Order Detail Modal
  async function openOrderDetail(order) {
    setSelectedOrder(order);
    setIsDetailOpen(true);
    try {
      const full = await fetchAdminOrderById(order.id);
      if (full) setSelectedOrder(full);
    } catch {
      // Giữ order hiện tại nếu lỗi fetch
    }
  }

  // Resend Invoice via Email
  async function handleSendInvoice(orderId, email) {
    setSendingInvoice(true);
    try {
      await sendAdminOrderInvoice(orderId, email);
      showToast(`Đã gửi hóa đơn điện tử đến ${email || "email khách hàng"} thành công!`, "success");
    } catch (err) {
      showToast(err?.message || "Lỗi khi gửi hóa đơn", "error");
    } finally {
      setSendingInvoice(false);
    }
  }

  function getStatusBadgeClass(status) {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return styles.statusConfirmed;
      case "SHIPPING":
        return styles.statusShipping;
      case "DELIVERED":
        return styles.statusDelivered;
      case "CANCELLED":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  }

  function getSourceBadgeClass(source) {
    switch (source?.toUpperCase()) {
      case "TIKTOK":
        return styles.sourceTikTok;
      case "FACEBOOK":
        return styles.sourceFacebook;
      case "INSTAGRAM":
        return styles.sourceInstagram;
      default:
        return styles.sourceOrganic;
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Quản lý Đơn hàng"
        subtitle="Theo dõi, duyệt đơn, cập nhật tiến độ giao hàng và xử lý hóa đơn cho toàn bộ đơn hàng của Routine"
        actions={
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={loadOrders}
            title="Làm mới danh sách đơn hàng"
          >
            🔄 Tải lại dữ liệu
          </button>
        }
      />

      {/* KPI STATS CARDS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>📦 Tổng số đơn hàng</span>
          <span className={styles.statValue}>{stats.totalOrders}</span>
          <span className={styles.statSub}>
            <strong>{stats.memberCount}</strong> thành viên · <strong>{stats.guestCount}</strong> vãng lai
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>💰 Doanh thu tích lũy</span>
          <span className={styles.statValue} style={{ color: "#059669" }}>
            {formatPrice(stats.totalRevenue)}
          </span>
          <span className={styles.statSub}>Không tính các đơn đã hủy</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>⏳ Chờ xử lý / Đã duyệt</span>
          <span className={styles.statValue} style={{ color: "#1d4ed8" }}>
            {stats.confirmedCount}
          </span>
          <span className={styles.statSub}>Cần đóng gói & bàn giao</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>🚚 Đang vận chuyển</span>
          <span className={styles.statValue} style={{ color: "#b45309" }}>
            {stats.shippingCount}
          </span>
          <span className={styles.statSub}>Đang trên đường giao khách</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>✅ Đã giao thành công</span>
          <span className={styles.statValue} style={{ color: "#065f46" }}>
            {stats.deliveredCount}
          </span>
          <span className={styles.statSub}>Đã nhận hàng & thu tiền</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>❌ Đơn đã hủy</span>
          <span className={styles.statValue} style={{ color: "#b91c1c" }}>
            {stats.cancelledCount}
          </span>
          <span className={styles.statSub}>Khách hủy hoặc hết hàng</span>
        </div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarTop}>
          {/* STATUS TABS */}
          <div className={styles.statusTabs}>
            {[
              { key: "ALL", label: "Tất cả", count: stats.totalOrders },
              { key: "CONFIRMED", label: "Đã xác nhận", count: stats.confirmedCount },
              { key: "SHIPPING", label: "Đang giao", count: stats.shippingCount },
              { key: "DELIVERED", label: "Đã giao", count: stats.deliveredCount },
              { key: "CANCELLED", label: "Đã hủy", count: stats.cancelledCount },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.statusTabBtn} ${statusFilter === tab.key ? styles.statusTabBtnActive : ""}`}
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
                <span className={styles.tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* SEARCH BOX */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Tìm theo mã đơn, tên, SĐT khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className={styles.btnSecondary}>
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* SECONDARY FILTERS */}
        <div className={styles.filterControls}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
            Lọc nâng cao:
          </span>

          <select
            className={styles.filterSelect}
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
          >
            <option value="ALL">Khách hàng: Tất cả</option>
            <option value="MEMBER">👤 Khách Thành viên ({stats.memberCount})</option>
            <option value="GUEST">👁️ Khách vãng lai ({stats.guestCount})</option>
          </select>

          <select
            className={styles.filterSelect}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="ALL">Thanh toán: Tất cả</option>
            <option value="COD">Thanh toán khi nhận hàng (COD)</option>
            <option value="VNPAY">Cổng VNPay</option>
          </select>

          <select
            className={styles.filterSelect}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="ALL">Nguồn tiếp cận: Tất cả</option>
            <option value="TIKTOK">🎵 TikTok</option>
            <option value="FACEBOOK">🌐 Facebook</option>
            <option value="INSTAGRAM">📸 Instagram</option>
            <option value="ORGANIC">🌱 Tự nhiên (Direct / Organic)</option>
          </select>

          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: "auto" }}>
            Hiển thị {filteredOrders.length} / {orders.length} đơn hàng
          </span>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className={styles.tableContainer}>
        {loading ? (
          <p style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
            Đang tải dữ liệu đơn hàng từ MySQL…
          </p>
        ) : filteredOrders.length === 0 ? (
          <p style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
            Không có đơn hàng nào phù hợp với bộ lọc.
          </p>
        ) : (
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>MÃ ĐƠN & NGÀY</th>
                <th>KHÁCH HÀNG & TÀI KHOẢN</th>
                <th>SẢN PHẨM</th>
                <th>TỔNG TIỀN</th>
                <th>THANH TOÁN</th>
                <th>TRẠNG THÁI ĐƠN</th>
                <th>NGUỒN TIẾP CẬN</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const firstItem = order.items?.[0] || {};
                const otherItemsCount = (order.items?.length || 1) - 1;
                const status = (order.orderStatus || order.status || "CONFIRMED").toUpperCase();
                const source = (order.attributionSource || order.user?.source || "ORGANIC").toUpperCase();
                const hasUser = !!(order.user || order.userId);

                return (
                  <tr key={order.id}>
                    {/* MÃ ĐƠN & NGÀY */}
                    <td>
                      <span className={styles.orderIdBadge}>{order.id}</span>
                      <div className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                    </td>

                    {/* KHÁCH HÀNG & TÀI KHOẢN */}
                    <td>
                      <div className={styles.customerInfo}>
                        {hasUser ? (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className={styles.badgeMember}>👤 Thành viên</span>
                              <span className={styles.customerName}>
                                {order.user?.fullName || order.receiverName}
                              </span>
                            </div>
                            {order.user?.email && (
                              <span className={styles.accountEmail}>✉️ {order.user.email}</span>
                            )}
                            {order.receiverName && order.user?.fullName && order.receiverName.toLowerCase() !== order.user.fullName.toLowerCase() ? (
                              <span className={styles.receiverSub}>
                                Nhận: <strong>{order.receiverName}</strong> · 📞 {order.phoneNumber}
                              </span>
                            ) : (
                              <span className={styles.customerPhone}>📞 {order.phoneNumber}</span>
                            )}
                          </>
                        ) : (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className={styles.badgeGuest}>👁️ Khách vãng lai</span>
                              <span className={styles.customerName}>
                                {order.receiverName || "Khách mua nhanh"}
                              </span>
                            </div>
                            <span className={styles.customerPhone}>📞 {order.phoneNumber}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* SẢN PHẨM TÓM TẮT */}
                    <td>
                      <div className={styles.itemsCell}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={firstItem.image || "/images/placeholder.svg"}
                          alt=""
                          className={styles.itemThumb}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/placeholder.svg";
                          }}
                        />
                        <div className={styles.itemSummary}>
                          <span className={styles.itemName}>{firstItem.name || "Sản phẩm thời trang"}</span>
                          {otherItemsCount > 0 ? (
                            <span className={styles.itemOtherCount}>+{otherItemsCount} sản phẩm khác</span>
                          ) : (
                            <span className={styles.itemOtherCount}>SL: {firstItem.quantity || 1}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* TỔNG TIỀN */}
                    <td>
                      <span className={styles.totalAmount}>{formatPrice(order.total)}</span>
                    </td>

                    {/* THANH TOÁN */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 12 }}>
                          {order.paymentMethod === "VNPAY" ? "💳 VNPay" : "💵 COD"}
                        </span>
                        <span
                          className={
                            order.paymentStatus === "PAID" ? styles.paymentPaid : styles.paymentUnpaid
                          }
                        >
                          {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                        </span>
                      </div>
                    </td>

                    {/* TRẠNG THÁI ĐƠN & SELECT NHANH */}
                    <td>
                      <select
                        className={`${styles.statusSelectDropdown} ${getStatusBadgeClass(status)}`}
                        value={status}
                        onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                      >
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="SHIPPING">Đang giao hàng</option>
                        <option value="DELIVERED">Đã giao thành công</option>
                        <option value="CANCELLED">Hủy đơn</option>
                      </select>
                    </td>

                    {/* NGUỒN TIẾP THỊ */}
                    <td>
                      <span className={`${styles.badge} ${getSourceBadgeClass(source)}`}>
                        {source === "TIKTOK" && "🎵 TikTok"}
                        {source === "FACEBOOK" && "🌐 FB"}
                        {source === "INSTAGRAM" && "📸 IG"}
                        {source === "ORGANIC" && "🌱 Tự nhiên"}
                      </span>
                    </td>

                    {/* THAO TÁC */}
                    <td>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => openOrderDetail(order)}
                        title="Xem chi tiết đơn hàng"
                      >
                        👁️ Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================== ORDER DETAIL MODAL ==================== */}
      {isDetailOpen && selectedOrder && (
        <div className={styles.modalBackdrop} onClick={() => setIsDetailOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  Chi tiết đơn hàng #{selectedOrder.id}
                </h3>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  Đặt lúc: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsDetailOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* TIMELINE STEPPER */}
              <div className={styles.stepper}>
                {[
                  { step: "CONFIRMED", label: "Đã xác nhận" },
                  { step: "SHIPPING", label: "Đang giao" },
                  { step: "DELIVERED", label: "Hoàn tất" },
                ].map((item, idx) => {
                  const currentSt = (selectedOrder.orderStatus || selectedOrder.status || "").toUpperCase();
                  const isCurrentActive =
                    item.step === currentSt ||
                    (currentSt === "SHIPPING" && idx <= 1) ||
                    (currentSt === "DELIVERED" && idx <= 2);

                  return (
                    <div
                      key={item.step}
                      className={`${styles.stepItem} ${isCurrentActive ? styles.stepActive : ""}`}
                    >
                      <div className={styles.stepCircle}>{idx + 1}</div>
                      <span className={styles.stepLabel}>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* 3-COLUMN INFO */}
              <div className={styles.detailGrid3}>
                {/* 1. THÔNG TIN TÀI KHOẢN ĐẶT HÀNG */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>👤 Tài khoản đặt hàng</h4>
                  {selectedOrder.user || selectedOrder.userId ? (
                    <>
                      <div className={styles.detailRow}>
                        <span>Phân loại:</span>
                        <span className={styles.badgeMember}>👤 Khách Thành Viên</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Tên tài khoản:</span>
                        <span className={styles.detailRowValue} style={{ fontWeight: 600 }}>
                          {selectedOrder.user?.fullName || selectedOrder.receiverName}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Email tài khoản:</span>
                        <span className={styles.detailRowValue} style={{ wordBreak: "break-all" }}>
                          {selectedOrder.user?.email || "—"}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>SĐT tài khoản:</span>
                        <span className={styles.detailRowValue}>
                          📞 {selectedOrder.user?.phoneNumber || selectedOrder.phoneNumber}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Kênh đăng ký:</span>
                        <span className={`${styles.badge} ${getSourceBadgeClass(selectedOrder.user?.source || selectedOrder.attributionSource)}`}>
                          {selectedOrder.user?.source || selectedOrder.attributionSource || "ORGANIC"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.detailRow}>
                        <span>Phân loại:</span>
                        <span className={styles.badgeGuest}>👁️ Khách Vãng Lai (Guest)</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Hình thức:</span>
                        <span className={styles.detailRowValue}>Đặt hàng nhanh tại checkout</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Mã phiên (Guest):</span>
                        <span className={styles.detailRowValue} style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" }}>
                          {selectedOrder.guestSessionId || "N/A"}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Kênh tiếp cận:</span>
                        <span className={`${styles.badge} ${getSourceBadgeClass(selectedOrder.attributionSource)}`}>
                          {selectedOrder.attributionSource || "ORGANIC"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* 2. THÔNG TIN GIAO NHẬN */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>📍 Thông tin giao nhận</h4>
                  <div className={styles.detailRow}>
                    <span>Người nhận:</span>
                    <span className={styles.detailRowValue}>{selectedOrder.receiverName}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Số điện thoại:</span>
                    <span className={styles.detailRowValue}>📞 {selectedOrder.phoneNumber}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Địa chỉ:</span>
                    <span className={styles.detailRowValue} style={{ maxWidth: 220 }}>
                      {typeof selectedOrder.shippingAddress === "object"
                        ? selectedOrder.shippingAddress?.address || selectedOrder.shippingAddress?.fullAddress || JSON.stringify(selectedOrder.shippingAddress)
                        : selectedOrder.shippingAddress}
                    </span>
                  </div>
                  {selectedOrder.note && (
                    <div className={styles.detailRow}>
                      <span>Ghi chú:</span>
                      <span className={styles.detailRowValue} style={{ fontStyle: "italic" }}>
                        &quot;{selectedOrder.note}&quot;
                      </span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span>Kênh đơn này:</span>
                    <span className={`${styles.badge} ${getSourceBadgeClass(selectedOrder.attributionSource)}`}>
                      {selectedOrder.attributionSource || "ORGANIC"}
                    </span>
                  </div>
                </div>

                {/* 3. THÔNG TIN THANH TOÁN */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>💳 Thanh toán & Tài chính</h4>
                  <div className={styles.detailRow}>
                    <span>Phương thức:</span>
                    <span className={styles.detailRowValue}>
                      {selectedOrder.paymentMethod === "VNPAY" ? "Cổng thanh toán VNPay" : "Thanh toán khi nhận (COD)"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Trạng thái tiền:</span>
                    <span
                      className={
                        selectedOrder.paymentStatus === "PAID" ? styles.paymentPaid : styles.paymentUnpaid
                      }
                    >
                      {selectedOrder.paymentStatus === "PAID" ? "ĐÃ THANH TOÁN (PAID)" : "CHƯA THANH TOÁN (UNPAID)"}
                    </span>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px dashed var(--color-border)", margin: "4px 0" }} />
                  <div className={styles.detailRow}>
                    <span>Tạm tính hàng:</span>
                    <span className={styles.detailRowValue}>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Phí vận chuyển:</span>
                    <span className={styles.detailRowValue}>
                      {selectedOrder.shippingFee > 0 ? formatPrice(selectedOrder.shippingFee) : "Miễn phí (0đ)"}
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className={styles.detailRow}>
                      <span>Giảm giá {selectedOrder.appliedCoupon ? `(${selectedOrder.appliedCoupon})` : ""}:</span>
                      <span className={styles.detailRowValue} style={{ color: "#ef4444" }}>
                        -{formatPrice(selectedOrder.discount)}
                      </span>
                    </div>
                  )}
                  <div className={styles.detailRow} style={{ fontSize: 15, fontWeight: 700, color: "#111", marginTop: 4 }}>
                    <span>Tổng đơn hàng:</span>
                    <span style={{ color: "var(--color-primary)" }}>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* DANH SÁCH MÓN HÀNG */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
                  Danh sách sản phẩm ({selectedOrder.items?.length || 0} món)
                </h4>
                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <table className={styles.modalItemsTable}>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Phân loại</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th style={{ textAlign: "right" }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image || "/images/placeholder.svg"}
                              alt=""
                              style={{ width: 40, height: 50, objectFit: "cover", borderRadius: 4 }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/images/placeholder.svg";
                              }}
                            />
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                          </td>
                          <td style={{ color: "var(--color-text-secondary)" }}>
                            Size: <strong>{item.size || "M"}</strong> | Màu: <strong>{item.color || "Đen"}</strong>
                          </td>
                          <td>{formatPrice(item.price)}</td>
                          <td>x{item.quantity}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            {formatPrice(item.subtotal || item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className={styles.modalFooter}>
              <div className={styles.footerLeft}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => handleSendInvoice(selectedOrder.id, selectedOrder.email)}
                  disabled={sendingInvoice}
                  title="Gửi lại hóa đơn điện tử cho khách qua Email"
                >
                  📧 {sendingInvoice ? "Đang gửi email…" : "Gửi hóa đơn qua Email"}
                </button>
              </div>

              <div className={styles.footerRight}>
                {selectedOrder.orderStatus !== "SHIPPING" && selectedOrder.orderStatus !== "DELIVERED" && selectedOrder.orderStatus !== "CANCELLED" && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => handleQuickStatusChange(selectedOrder.id, "SHIPPING")}
                  >
                    🚚 Bắt đầu giao hàng
                  </button>
                )}
                {selectedOrder.orderStatus === "SHIPPING" && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => handleQuickStatusChange(selectedOrder.id, "DELIVERED")}
                  >
                    ✅ Hoàn tất & Đã giao
                  </button>
                )}
                {selectedOrder.orderStatus !== "CANCELLED" && selectedOrder.orderStatus !== "DELIVERED" && (
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
                        handleQuickStatusChange(selectedOrder.id, "CANCELLED");
                      }
                    }}
                  >
                    ❌ Hủy đơn này
                  </button>
                )}
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsDetailOpen(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
