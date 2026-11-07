"use client";

import { useEffect, useState, useRef } from "react";
import { slugify } from "@/data/products";
import { IconX, IconUpload } from "./icons";
import { uploadImageFile } from "@/lib/uploadService";
import { getCategoryImageFallback } from "@/lib/categoryImages";
import fieldStyles from "./selectors.module.css";
import styles from "./FormModal.module.css";

const CATEGORY_IMAGES = [
  "tops", "tshirt", "polo", "shirt", "bottoms", "jeans", "trousers",
  "shorts", "outerwear", "jacket", "blazer", "sneakers", "accessories",
  "new-arrivals", "men", "women", "unisex",
];

function emptyForm() {
  return { name: "", slug: "", parentId: "", description: "", imageUrl: "", status: "ACTIVE" };
}

export default function CategoryFormModal({ open, category, parentOptions, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  async function handleFileUpload(file) {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadImageFile(file);
      set("imageUrl", url);
    } catch (err) {
      setUploadError(err?.message || "Không thể tải ảnh lên server");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setForm(
        category
          ? {
              name: category.name,
              slug: category.slug,
              parentId: category.parentId || "",
              description: category.description || "",
              imageUrl: category.imageUrl || category.image || "",
              status: category.status,
            }
          : emptyForm()
      );
      setSlugTouched(!!category);
      setError("");
    }
  }, [open, category]);

  if (!open) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(value) {
    setForm((prev) => ({ ...prev, name: value, slug: slugTouched ? prev.slug : slugify(value) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, parentId: form.parentId || null });
      onClose();
    } catch (err) {
      setError(err?.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={category ? "Edit Category" : "Add Category"}>
        <div className={styles.header}>
          <h2 className={styles.title}>{category ? "Edit Category" : "Add Category"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>
              Category Name <span className={fieldStyles.required}>*</span>
            </label>
            <input className={fieldStyles.select} value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
          </div>

          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>Slug</label>
            <input
              className={fieldStyles.select}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
          </div>

          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>Parent Category</label>
            <select className={fieldStyles.select} value={form.parentId} onChange={(e) => set("parentId", e.target.value)}>
              <option value="">None (top-level)</option>
              {parentOptions
                .filter((c) => c.id !== category?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>Description</label>
            <textarea
              className={fieldStyles.select}
              style={{ resize: "vertical" }}
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* SINGLE CATEGORY IMAGE UPLOADER */}
          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>Category Image (Tải 1 ảnh từ máy tính hoặc chọn có sẵn)</label>
            
            {form.imageUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-secondary)" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--color-primary)", flexShrink: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={form.imageUrl}
                    alt="Category preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onLoad={(e) => { delete e.currentTarget.dataset.fallbackAttempted; }}
                    onError={(e) => {
                      if (e.currentTarget.dataset.fallbackAttempted) {
                        e.currentTarget.style.visibility = "hidden";
                        return;
                      }
                      e.currentTarget.dataset.fallbackAttempted = "true";
                      e.currentTarget.src = getCategoryImageFallback({ slug: form.slug, name: form.name });
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.imageUrl}</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>Ảnh hiện tại của danh mục (sẽ hiển thị dạng hình tròn trên trang chủ)</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: 12, padding: "4px 10px", borderRadius: 4, background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer" }}
                    >
                      {uploading ? "Đang tải…" : "Đổi ảnh khác"}
                    </button>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => set("imageUrl", "")}
                      style={{ fontSize: 12, padding: "4px 10px", borderRadius: 4, background: "transparent", color: "#dc2626", border: "1px solid #dc2626", cursor: "pointer" }}
                    >
                      Gỡ ảnh
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                style={{
                  border: "2px dashed var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "24px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "var(--color-bg-secondary)",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <IconUpload size={24} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {uploading ? "Đang tải ảnh lên server…" : "Click để chọn ảnh hoặc kéo thả vào đây"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    Hỗ trợ JPG, JPEG, PNG, WEBP (tối đa 20MB trước khi tối ưu)
                  </span>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                e.target.value = "";
              }}
            />

            {uploadError ? <p className={fieldStyles.errorText} style={{ marginTop: 6 }}>{uploadError}</p> : null}

            {/* Quick preset selector */}
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Hoặc chọn từ icon mặc định: </span>
              <select
                className={fieldStyles.select}
                style={{ display: "inline-block", width: "auto", fontSize: 12, padding: "4px 8px", marginTop: 4 }}
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
              >
                <option value="">-- Chọn icon có sẵn --</option>
                {CATEGORY_IMAGES.map((slug) => (
                  <option key={slug} value={`/images/categories/${slug}.svg`}>
                    {slug}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>Status</label>
            <div className={fieldStyles.pillGroup}>
              {["ACTIVE", "INACTIVE"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${fieldStyles.pill} ${form.status === s ? fieldStyles.pillActive : ""}`}
                  onClick={() => set("status", s)}
                >
                  {s === "ACTIVE" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className={fieldStyles.errorText}>{error}</p> : null}

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
