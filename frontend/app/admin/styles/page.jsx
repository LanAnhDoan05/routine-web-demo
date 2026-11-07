"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmModal from "@/components/admin/ConfirmModal";
import StyleFormModal from "@/components/admin/StyleFormModal";
import { useToast } from "@/components/admin/ToastProvider";
import { IconPlus, IconEdit, IconTrash, IconStyles } from "@/components/admin/icons";
import { getStyles, getStyleProductCounts, createStyle, updateStyle, deleteStyle } from "@/lib/styleService";
import styles from "@/components/admin/adminTable.module.css";

export default function StylesPage() {
  const { showToast } = useToast();
  const [styleList, setStyleList] = useState(null);
  const [counts, setCounts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [list, productCounts] = await Promise.all([
      getStyles().catch(() => []),
      getStyleProductCounts().catch(() => ({})),
    ]);
    setStyleList(list);
    setCounts(productCounts);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingStyle(null);
    setModalOpen(true);
  }

  function openEdit(style) {
    setEditingStyle(style);
    setModalOpen(true);
  }

  async function handleSave(payload) {
    if (editingStyle) {
      await updateStyle(editingStyle.id, payload);
      showToast("Đã cập nhật style.", "success");
    } else {
      await createStyle(payload);
      showToast("Đã thêm style mới. Style sẽ xuất hiện trong Product Form.", "success");
    }
    await load();
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteStyle(pendingDelete.id);
      showToast(`Đã xoá “${pendingDelete.name}”.`, "success");
      await load();
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Styles"
        subtitle="Quản lý style dùng để phân loại sản phẩm và outfit"
        actions={
          <button type="button" className={styles.addBtn} onClick={openAdd}>
            <IconPlus size={16} /> Add Style
          </button>
        }
      />

      {styleList === null ? (
        <p className={styles.loadingText}>Đang tải style…</p>
      ) : styleList.length === 0 ? (
        <EmptyState icon={<IconStyles size={20} />} title="Chưa có style nào" />
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Style</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {styleList.map((s) => (
                  <tr key={s.id}>
                    <td className={styles.nameCell}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", border: "1px solid var(--color-border)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <img
                            src={s.imageUrl || s.image || "/images/styles/basic.jpg"}
                            alt={s.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.currentTarget.src = "/images/styles/basic.jpg"; }}
                          />
                        </div>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                      </div>
                    </td>
                    <td>{s.description}</td>
                    <td>{counts[s.id] || 0}</td>
                    <td>
                      <StatusBadge value={s.status} />
                    </td>
                    <td className={styles.actionsCol}>
                      <button type="button" className={styles.iconBtn} onClick={() => openEdit(s)} aria-label={`Sửa ${s.name}`}>
                        <IconEdit size={14} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => setPendingDelete(s)}
                        aria-label={`Xoá ${s.name}`}
                      >
                        <IconTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StyleFormModal open={modalOpen} style={editingStyle} onSave={handleSave} onClose={() => setModalOpen(false)} />

      <ConfirmModal
        open={!!pendingDelete}
        title={`Xoá “${pendingDelete?.name}”?`}
        description="Sản phẩm đang gán style này sẽ không tự động được gỡ style."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
