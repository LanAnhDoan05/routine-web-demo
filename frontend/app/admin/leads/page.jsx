"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/ToastProvider";
import { fetchApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import styles from "./page.module.css";

const STATUS_LABELS = {
  LEAD_PENDING: "Chờ tiếp nhận",
  IN_PROGRESS: "Đang tư vấn",
  CLOSED: "Đã đóng",
};

const ROLE_LABELS = {
  CUSTOMER: "Khách hàng",
  AI: "AI Stylist",
  STAFF: "Chuyên viên",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

export default function AdminLeadsPage() {
  const { showToast } = useToast();
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesRequestRef = useRef(0);

  const loadMessages = useCallback(async (leadId) => {
    const requestId = ++messagesRequestRef.current;
    if (!leadId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    setLoadingMessages(true);
    try {
      const result = await fetchApi(`/ai/admin/leads/${leadId}/messages`);
      if (requestId === messagesRequestRef.current) {
        setMessages(Array.isArray(result?.messages) ? result.messages : []);
      }
    } catch (error) {
      if (requestId === messagesRequestRef.current) {
        showToast(error.message || "Không thể tải lịch sử hội thoại", "error");
      }
    } finally {
      if (requestId === messagesRequestRef.current) setLoadingMessages(false);
    }
  }, [showToast]);

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const result = await fetchApi("/ai/admin/leads");
      const nextLeads = Array.isArray(result?.leads) ? result.leads : [];
      setLeads(nextLeads);
      const selected = nextLeads.some((lead) => lead.id === selectedLeadId)
        ? selectedLeadId
        : nextLeads[0]?.id || null;
      setSelectedLeadId(selected);
      if (selected !== selectedLeadId) loadMessages(selected);
    } catch (error) {
      showToast(error.message || "Không thể tải danh sách yêu cầu tư vấn", "error");
    } finally {
      setLoadingLeads(false);
    }
  }, [loadMessages, selectedLeadId, showToast]);

  useEffect(() => {
    let active = true;
    fetchApi("/ai/admin/leads")
      .then((result) => {
        if (!active) return;
        const nextLeads = Array.isArray(result?.leads) ? result.leads : [];
        setLeads(nextLeads);
        const firstLeadId = nextLeads[0]?.id || null;
        setSelectedLeadId(firstLeadId);
        if (firstLeadId) loadMessages(firstLeadId);
      })
      .catch((error) => {
        if (active) showToast(error.message || "Không thể tải danh sách yêu cầu tư vấn", "error");
      })
      .finally(() => {
        if (active) setLoadingLeads(false);
      });
    return () => {
      active = false;
    };
  }, [loadMessages, showToast]);

  const filteredLeads = statusFilter === "ALL"
    ? leads
    : leads.filter((lead) => lead.status === statusFilter);
  const selectedLead = filteredLeads.find((lead) => lead.id === selectedLeadId) || null;

  function selectLead(leadId) {
    setSelectedLeadId(leadId);
    loadMessages(leadId);
  }
  async function updateStatus(status) {
    if (!selectedLead) return;
    try {
      await fetchApi(`/ai/admin/leads/${selectedLead.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setLeads((current) => current.map((lead) =>
        lead.id === selectedLead.id ? { ...lead, status } : lead
      ));
      showToast(`Đã cập nhật trạng thái: ${STATUS_LABELS[status]}`, "success");
    } catch (error) {
      showToast(error.message || "Không thể cập nhật trạng thái yêu cầu", "error");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!selectedLead || !text || sending) return;
    setSending(true);
    try {
      await fetchApi(`/ai/admin/leads/${selectedLead.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setDraft("");
      await Promise.all([loadMessages(selectedLead.id), loadLeads()]);
    } catch (error) {
      showToast(error.message || "Không thể gửi tin nhắn", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Khách hàng cần tư vấn"
        subtitle="Chỉ hiển thị những khách đã đồng ý chia sẻ hội thoại với chuyên viên Routine."
        actions={<button type="button" className={styles.refreshButton} onClick={loadLeads}>Làm mới</button>}
      />

      <div className={styles.workspace}>
        <section className={styles.leadPanel} aria-label="Danh sách yêu cầu tư vấn">
          <div className={styles.panelHeading}>
            <h2>Yêu cầu tư vấn</h2>
            <span>{filteredLeads.length}</span>
          </div>
          <label className={styles.filterLabel} htmlFor="lead-status-filter">Trạng thái</label>
          <select
            id="lead-status-filter"
            className={styles.statusFilter}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">Tất cả</option>
            <option value="LEAD_PENDING">Chờ tiếp nhận</option>
            <option value="IN_PROGRESS">Đang tư vấn</option>
            <option value="CLOSED">Đã đóng</option>
          </select>

          {loadingLeads ? (
            <p className={styles.emptyState}>Đang tải yêu cầu tư vấn…</p>
          ) : filteredLeads.length === 0 ? (
            <p className={styles.emptyState}>Chưa có yêu cầu tư vấn phù hợp.</p>
          ) : (
            <ul className={styles.leadList}>
              {filteredLeads.map((lead) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    className={`${styles.leadButton} ${selectedLeadId === lead.id ? styles.leadButtonActive : ""}`}
                    onClick={() => selectLead(lead.id)}
                  >
                    <span className={styles.leadTopLine}>
                      <strong>{lead.customer?.name || "Khách vãng lai"}</strong>
                      <span className={styles.score}>{lead.intentScore}/100</span>
                    </span>
                    <span className={styles.leadStatus}>{STATUS_LABELS[lead.status] || lead.status}</span>
                    <span className={styles.lastMessage}>{lead.lastMessage || "Chưa có tin nhắn"}</span>
                    <span className={styles.leadDate}>{formatDate(lead.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {selectedLead ? (
          <section className={styles.detailPanel} aria-label="Chi tiết yêu cầu tư vấn">
            <div className={styles.detailHeader}>
              <div>
                <h2>{selectedLead.customer?.name || "Khách vãng lai"}</h2>
                <p>{selectedLead.customer?.email || "Khách chưa đăng nhập"}</p>
                {selectedLead.customer?.phone && <p>{selectedLead.customer.phone}</p>}
              </div>
              <div className={styles.statusActions}>
                <span className={styles.statusBadge}>{STATUS_LABELS[selectedLead.status] || selectedLead.status}</span>
                {selectedLead.status === "LEAD_PENDING" && (
                  <button type="button" onClick={() => updateStatus("IN_PROGRESS")}>Nhận tư vấn</button>
                )}
                {selectedLead.status !== "CLOSED" && (
                  <button type="button" className={styles.secondaryButton} onClick={() => updateStatus("CLOSED")}>
                    Đóng yêu cầu
                  </button>
                )}
                {selectedLead.status === "CLOSED" && (
                  <button type="button" className={styles.secondaryButton} onClick={() => updateStatus("IN_PROGRESS")}>
                    Mở lại
                  </button>
                )}
              </div>
            </div>

            <div className={styles.insights}>
              <div><span>Purchase Intent</span><strong>{selectedLead.intentScore}/100 · {selectedLead.intentLevel}</strong></div>
              <div><span>Ngân sách đã nêu</span><strong>{selectedLead.budget ? formatPrice(selectedLead.budget) : "Chưa xác định"}</strong></div>
              <div><span>Đồng ý tư vấn lúc</span><strong>{formatDate(selectedLead.handoffConsentedAt)}</strong></div>
              {selectedLead.intentReason && <p>{selectedLead.intentReason}</p>}
              {Array.isArray(selectedLead.intentSignals) && selectedLead.intentSignals.length > 0 && (
                <ul>{selectedLead.intentSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
              )}
            </div>

            {selectedLead.interestedProducts?.length > 0 && (
              <div className={styles.products}>
                <h3>Sản phẩm quan tâm</h3>
                <ul>
                  {selectedLead.interestedProducts.map((product) => (
                    <li key={product.id}>
                      <span>{product.name}</span>
                      <span>{formatPrice(product.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.thread} aria-live="polite">
              {loadingMessages ? <p className={styles.emptyState}>Đang tải hội thoại…</p> : messages.map((message) => (
                <article className={`${styles.message} ${styles[`message${message.role}`] || ""}`} key={message.id}>
                  <strong>{ROLE_LABELS[message.role] || message.role}</strong>
                  <p>{message.text}</p>
                  {message.metadata?.imageUrl && (
                    <a href={message.metadata.imageUrl} target="_blank" rel="noreferrer">Xem ảnh khách gửi</a>
                  )}
                  <time>{formatDate(message.createdAt)}</time>
                </article>
              ))}
            </div>

            <form className={styles.replyForm} onSubmit={sendMessage}>
              <label className={styles.srOnly} htmlFor="lead-reply">Tin nhắn tư vấn viên</label>
              <textarea
                id="lead-reply"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={4000}
                placeholder="Nhắn tin với khách hàng…"
                required
              />
              <button type="submit" disabled={sending || !draft.trim()}>
                {sending ? "Đang gửi…" : "Gửi tin nhắn"}
              </button>
            </form>
          </section>
        ) : (
          <section className={`${styles.detailPanel} ${styles.noSelection}`}>
            <p>{loadingLeads ? "Đang tải…" : "Chọn một yêu cầu tư vấn để xem hội thoại và thông tin liên quan."}</p>
          </section>
        )}
      </div>
    </div>
  );
}
