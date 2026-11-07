"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmModal from "@/components/admin/ConfirmModal";
import OutfitFormModal from "@/components/admin/OutfitFormModal";
import { useToast } from "@/components/admin/ToastProvider";
import { IconPlus, IconEdit, IconTrash, IconOutfits } from "@/components/admin/icons";
import { getOutfits, createOutfit, updateOutfit, deleteOutfit } from "@/lib/outfitService";
import { getProducts } from "@/lib/adminProductService";
import { getStyles } from "@/lib/styleService";
import styles from "./page.module.css";

export default function OutfitsPage() {
  const { showToast } = useToast();
  const [outfits, setOutfits] = useState(null);
  const [products, setProducts] = useState([]);
  const [stylesList, setStylesList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [outfitList, productList, stList] = await Promise.all([
      getOutfits(),
      getProducts(),
      getStyles().catch(() => []),
    ]);
    setOutfits(outfitList);
    setProducts(productList);
    if (Array.isArray(stList)) setStylesList(stList);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingOutfit(null);
    setModalOpen(true);
  }

  function openEdit(outfit) {
    setEditingOutfit(outfit);
    setModalOpen(true);
  }

  async function handleSave(payload) {
    if (editingOutfit) {
      await updateOutfit(editingOutfit.id, payload);
      showToast("Đã cập nhật outfit.", "success");
    } else {
      await createOutfit(payload);
      showToast("Đã thêm outfit mới.", "success");
    }
    await load();
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteOutfit(pendingDelete.id);
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
        title="Outfits"
        subtitle="Quản lý các set Smart Outfit gợi ý cho khách hàng"
        actions={
          <button type="button" className={styles.addBtn} onClick={openAdd}>
            <IconPlus size={16} /> Add Outfit
          </button>
        }
      />

      {outfits === null ? (
        <p className={styles.loadingText}>Đang tải outfit…</p>
      ) : outfits.length === 0 ? (
        <EmptyState icon={<IconOutfits size={20} />} title="Chưa có outfit nào" />
      ) : (
        <div className={styles.grid}>
          {outfits.map((o) => {
            const style = stylesList.find((s) => s.id === o.styleId || s.slug === o.styleId || s.id === o.style || s.slug === o.style);
            return (
              <div key={o.id} className={styles.card}>
                <div className={styles.coverWrap}>
                  <img src={o.coverImage} alt="" className={styles.cover} />
                  <span className={styles.statusOverlay}>
                    <StatusBadge value={o.status} />
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{o.name}</h3>
                  <p className={styles.cardMeta}>
                    {style?.name || "—"} · {o.gender} · {o.occasion || "—"}
                  </p>
                  <p className={styles.cardDesc}>{o.description}</p>
                  <p className={styles.productCount}>{o.productIds.length} sản phẩm</p>
                  <div className={styles.cardActions}>
                    <button type="button" className={styles.cardBtn} onClick={() => openEdit(o)}>
                      <IconEdit size={13} /> Edit
                    </button>
                    <button type="button" className={`${styles.cardBtn} ${styles.cardBtnDanger}`} onClick={() => setPendingDelete(o)}>
                      <IconTrash size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OutfitFormModal
        open={modalOpen}
        outfit={editingOutfit}
        products={products}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmModal
        open={!!pendingDelete}
        title={`Xoá “${pendingDelete?.name}”?`}
        description="Hành động này không thể hoàn tác."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
