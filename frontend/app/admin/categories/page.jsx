"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmModal from "@/components/admin/ConfirmModal";
import CategoryFormModal from "@/components/admin/CategoryFormModal";
import { useToast } from "@/components/admin/ToastProvider";
import { IconPlus, IconEdit, IconTrash, IconCategories } from "@/components/admin/icons";
import {
  getCategories,
  getCategoryProductCounts,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/categoryService";
import styles from "@/components/admin/adminTable.module.css";

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState(null);
  const [counts, setCounts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [cats, productCounts] = await Promise.all([
      getCategories().catch(() => []),
      getCategoryProductCounts().catch(() => ({})),
    ]);
    setCategories(cats);
    setCounts(productCounts);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEdit(category) {
    setEditingCategory(category);
    setModalOpen(true);
  }

  async function handleSave(payload) {
    if (editingCategory) {
      await updateCategory(editingCategory.id, payload);
      showToast("Đã cập nhật danh mục.", "success");
    } else {
      await createCategory(payload);
      showToast("Đã thêm danh mục mới.", "success");
    }
    await load();
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      showToast(`Đã xoá “${pendingDelete.name}”.`, "success");
      await load();
    } catch (err) {
      showToast(err?.message || "Không thể xoá danh mục.", "error");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  const rootCategories = (categories || []).filter((c) => !c.parentId);
  const childrenOf = (id) => (id ? (categories || []).filter((c) => c.parentId === id && c.id !== id) : []);

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Quản lý danh mục sản phẩm và cấu trúc phân cấp"
        actions={
          <button type="button" className={styles.addBtn} onClick={openAdd}>
            <IconPlus size={16} /> Add Category
          </button>
        }
      />

      {categories === null ? (
        <p className={styles.loadingText}>Đang tải danh mục…</p>
      ) : categories.length === 0 ? (
        <EmptyState icon={<IconCategories size={20} />} title="Chưa có danh mục nào" />
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Parent</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rootCategories.map((root) => (
                  <CategoryRows
                    key={root.id}
                    category={root}
                    depth={0}
                    childrenOf={childrenOf}
                    counts={counts}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CategoryFormModal
        open={modalOpen}
        category={editingCategory}
        parentOptions={categories || []}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmModal
        open={!!pendingDelete}
        title={`Xoá “${pendingDelete?.name}”?`}
        description="Danh mục có sản phẩm con sẽ không thể xoá cho đến khi xoá hết danh mục con."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function CategoryRows({ category, depth, childrenOf, counts, onEdit, onDelete }) {
  const children = childrenOf(category.id);
  return (
    <>
      <tr>
        <td>
          <span className={styles.nameCell} style={{ paddingLeft: depth * 20 }}>
            {depth > 0 ? <span className={styles.treeMark}>└</span> : null}
            {category.name}
          </span>
        </td>
        <td className={styles.mono}>{category.slug}</td>
        <td>{depth > 0 ? "—" : "Top level"}</td>
        <td>{counts[category.id] || 0}</td>
        <td>
          <StatusBadge value={category.status} />
        </td>
        <td className={styles.actionsCol}>
          <button type="button" className={styles.iconBtn} onClick={() => onEdit(category)} aria-label={`Sửa ${category.name}`}>
            <IconEdit size={14} />
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => onDelete(category)}
            aria-label={`Xoá ${category.name}`}
          >
            <IconTrash size={14} />
          </button>
        </td>
      </tr>
      {children.map((child) => (
        <CategoryRows
          key={child.id}
          category={child}
          depth={depth + 1}
          childrenOf={childrenOf}
          counts={counts}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
