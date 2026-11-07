"use client";

import { useEffect, useState } from "react";
import { slugify } from "@/data/products";
import { getStyles } from "@/lib/styleService";
import { IconX } from "./icons";
import ImageUploader from "./ImageUploader";
import fieldStyles from "./selectors.module.css";
import styles from "./FormModal.module.css";
import modalStyles from "./OutfitFormModal.module.css";

const GENDERS = ["MEN", "WOMEN", "UNISEX"];

function normalizeOutfitImages(outfit) {
  if (!outfit) return [];
  const list = Array.isArray(outfit.images) && outfit.images.length > 0
    ? outfit.images
    : (outfit.coverImage || outfit.image ? [outfit.coverImage || outfit.image] : []);

  return list
    .map((item, idx) => {
      if (typeof item === "string") {
        return {
          id: `img-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          url: item,
          isPrimary: idx === 0,
          displayOrder: idx + 1,
        };
      }
      return {
        id: item.id || `img-${idx}`,
        url: item.url || item.image || "",
        isPrimary: item.isPrimary ?? idx === 0,
        displayOrder: item.displayOrder ?? idx + 1,
      };
    })
    .filter((img) => Boolean(img.url));
}

function emptyForm(defaultStyleId = "") {
  return {
    name: "",
    slug: "",
    description: "",
    coverImage: "",
    images: [],
    styleId: defaultStyleId,
    gender: "UNISEX",
    occasion: "",
    productIds: [],
    status: "ACTIVE",
  };
}

export default function OutfitFormModal({ open, outfit, products, onSave, onClose }) {
  const [stylesList, setStylesList] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStyles().then((sts) => {
      if (Array.isArray(sts)) setStylesList(sts);
    });
  }, []);

  useEffect(() => {
    if (open) {
      const defaultStyle = stylesList[0]?.id || "minimal";
      setForm(
        outfit
          ? {
              name: outfit.name || outfit.title || "",
              slug: outfit.slug || "",
              description: outfit.description || "",
              coverImage: outfit.coverImage || outfit.image || "",
              images: normalizeOutfitImages(outfit),
              styleId: outfit.styleId || outfit.style || defaultStyle,
              gender: (outfit.gender || "UNISEX").toUpperCase(),
              occasion: outfit.occasion || "",
              productIds: outfit.productIds || (outfit.products ? outfit.products.map((p) => p.id) : []),
              status: (outfit.status || "ACTIVE").toUpperCase(),
            }
          : emptyForm(defaultStyle)
      );
      setSlugTouched(!!outfit);
      setError("");
    }
  }, [open, outfit, stylesList]);

  if (!open) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(value) {
    setForm((prev) => ({ ...prev, name: value, slug: slugTouched ? prev.slug : slugify(value) }));
  }

  function toggleProduct(id) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id) ? prev.productIds.filter((v) => v !== id) : [...prev.productIds, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Outfit name is required.");
      return;
    }
    if (form.productIds.length === 0) {
      setError("Chọn ít nhất 1 sản phẩm cho outfit.");
      return;
    }

    const primaryImg =
      form.images?.find((img) => img.isPrimary)?.url ||
      form.images?.[0]?.url ||
      form.coverImage ||
      "/images/placeholder.jpg";

    const payload = {
      ...form,
      coverImage: primaryImg,
      image: primaryImg,
      images: (form.images || []).map((img) => img.url || img).filter(Boolean),
    };

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err?.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${modalStyles.wide}`} role="dialog" aria-modal="true" aria-label={outfit ? "Edit Outfit" : "Add Outfit"}>
        <div className={styles.header}>
          <h2 className={styles.title}>{outfit ? "Edit Outfit" : "Add Outfit"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>
              Outfit Name <span className={fieldStyles.required}>*</span>
            </label>
            <input className={fieldStyles.select} value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
          </div>

          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>Description</label>
            <textarea
              className={fieldStyles.select}
              style={{ resize: "vertical" }}
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className={modalStyles.row2}>
            <div className={fieldStyles.field}>
              <label className={fieldStyles.label}>Style</label>
              <select className={fieldStyles.select} value={form.styleId} onChange={(e) => set("styleId", e.target.value)}>
                {stylesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={fieldStyles.field}>
              <label className={fieldStyles.label}>Occasion</label>
              <input
                className={fieldStyles.select}
                value={form.occasion}
                onChange={(e) => set("occasion", e.target.value)}
                placeholder="work, casual, weekend, date…"
              />
            </div>
          </div>

          {/* OUTFIT IMAGES (Cover image & gallery like Products) */}
          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>
              Outfit Images (Tải nhiều ảnh & chọn ảnh bìa)
            </label>
            <ImageUploader
              images={form.images || []}
              onChange={(updater) =>
                setForm((prev) => ({
                  ...prev,
                  images: typeof updater === "function" ? updater(prev.images || []) : updater,
                }))
              }
            />
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 6 }}>
              Ảnh đầu tiên hoặc ảnh có biểu tượng ngôi sao sẽ làm ảnh bìa chính (Cover Image). Bạn có thể tải lên nhiều ảnh bằng cách kéo thả hoặc chọn từ máy tính.
            </p>
          </div>

          <div className={modalStyles.row2}>
            <div className={fieldStyles.field}>
              <label className={fieldStyles.label}>Gender</label>
              <div className={fieldStyles.pillGroup}>
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`${fieldStyles.pill} ${form.gender === g ? fieldStyles.pillActive : ""}`}
                    onClick={() => set("gender", g)}
                  >
                    {g.charAt(0) + g.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className={fieldStyles.field}>
              <label className={fieldStyles.label}>Status</label>
              <div className={fieldStyles.pillGroup}>
                {["DRAFT", "ACTIVE"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${fieldStyles.pill} ${form.status === s ? fieldStyles.pillActive : ""}`}
                    onClick={() => set("status", s)}
                  >
                    {s === "ACTIVE" ? "Active" : "Draft"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={fieldStyles.field}>
            <label className={fieldStyles.label}>
              Products <span className={fieldStyles.required}>*</span>
            </label>
            <div className={modalStyles.productList}>
              {products.map((p) => (
                <label key={p.id} className={modalStyles.productItem}>
                  <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                  <span>{p.name}</span>
                </label>
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
