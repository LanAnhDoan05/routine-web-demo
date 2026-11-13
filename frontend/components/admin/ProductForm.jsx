"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/data/products";
import { getCategories } from "@/lib/categoryService";
import { getStyles } from "@/lib/styleService";
import { getColorById, registerColor, toColorSlug } from "@/data/colors";
import { getSizeById } from "@/data/sizes";
import { suggestSkuPrefix, buildVariantSku } from "@/lib/sku";
import { isSkuTaken } from "@/lib/adminProductService";
import { useToast } from "./ToastProvider";
import CategorySelector from "./CategorySelector";
import StyleSelector from "./StyleSelector";
import ImageUploader from "./ImageUploader";
import VariantEditor from "./VariantEditor";
import { IconChevronDown } from "./icons";
import fieldStyles from "./selectors.module.css";
import styles from "./ProductForm.module.css";

const GENDERS = [
  { id: "MEN", label: "Men" },
  { id: "WOMEN", label: "Women" },
  { id: "UNISEX", label: "Unisex" },
];

const BADGES = [
  { id: "NONE", label: "None" },
  { id: "NEW", label: "New" },
  { id: "BEST_SELLER", label: "Best Seller" },
  { id: "SALE", label: "Sale" },
  { id: "LIMITED", label: "Limited" },
];

function emptyForm() {
  return {
    name: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    gender: "",
    styleIds: [],
    images: [],
    price: "",
    originalPrice: "",
    selectedColorIds: [],
    selectedSizeIds: [],
    variants: [],
    material: "",
    fit: "",
    pattern: "",
    season: "",
    origin: "Vietnam",
    careInstructions: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    status: "DRAFT",
    badge: "NONE",
    isFeatured: false,
    stockQuantity: "0",
  };
}

function productToForm(product) {
  if (!product) return emptyForm();

  // 1. Chuẩn hóa hình ảnh (array of objects { id, url, isPrimary, displayOrder })
  const rawImages = Array.isArray(product.images)
    ? product.images
    : typeof product.images === "string"
    ? [product.images]
    : [];
  const normalizedImages = rawImages.length > 0
    ? rawImages.map((img, i) => {
        if (typeof img === "string") {
          return {
            id: `img-${i + 1}-${Date.now().toString(36)}`,
            url: img,
            isPrimary: i === 0,
            displayOrder: i + 1,
          };
        }
        return {
          ...img,
          id: img.id || `img-${i + 1}-${Date.now().toString(36)}`,
          url: img.url || "",
          isPrimary: img.isPrimary !== undefined ? img.isPrimary : i === 0,
          displayOrder: img.displayOrder || i + 1,
        };
      })
    : [];

  // 2. Chuẩn hóa biến thể (variants) & khắc phục triệt để SKU trùng lặp
  const prefix = suggestSkuPrefix(product.name || "PRD");
  let rawVariants = Array.isArray(product.variants) && product.variants.length > 0 ? [...product.variants] : [];
  let variants = [];

  if (rawVariants.length > 0) {
    const seenSkus = new Set();
    variants = rawVariants.map((v, i) => {
      const cObj = getColorById(v.colorId || v.colorName);
      const sObj = getSizeById(v.sizeId || v.sizeName);
      const cId = cObj ? cObj.id : (v.colorId || v.colorName || "");
      const sId = sObj ? sObj.id : (v.sizeId || v.sizeName || "");
      let sku = (v.sku || "").trim();
      // Nếu SKU rỗng, bị trùng lặp hoặc chứa mã cũ không chuẩn (-CO-), tự sinh SKU mới độc nhất
      if (!sku || seenSkus.has(sku.toLowerCase()) || sku.includes("-CO-")) {
        sku = buildVariantSku(prefix, i + 1, cId, sId);
      }
      if (seenSkus.has(sku.toLowerCase())) {
        let counter = 1;
        let candidate = `${sku}-${counter}`;
        while (seenSkus.has(candidate.toLowerCase())) {
          counter += 1;
          candidate = `${sku}-${counter}`;
        }
        sku = candidate;
      }
      seenSkus.add(sku.toLowerCase());

      return {
        ...v,
        colorId: cId,
        colorName: cObj ? cObj.name : (v.colorName || "Default"),
        sizeId: sId,
        sizeName: sObj ? sObj.name : (v.sizeName || "Default"),
        sku,
        price: v.price !== undefined ? Number(v.price) : (Number(product.price) || 0),
        stockQuantity: v.stockQuantity !== undefined ? Number(v.stockQuantity) : 0,
        status: v.status || "ACTIVE",
      };
    });
  } else {
  }

  const optionColorIds = Array.isArray(product.colors)
    ? product.colors.map((name) => {
        const found = getColorById(name);
        if (found) return found.id;
        const id = `color-${toColorSlug(name) || "custom"}`;
        registerColor({ id, name, hexCode: "#666666" });
        return id;
      })
    : [];
  const optionSizeIds = Array.isArray(product.sizes)
    ? product.sizes.map((name) => {
        const found = getSizeById(name);
        if (found) return found.id;
        const slug = String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return slug ? `size-${slug}` : null;
      }).filter(Boolean)
    : [];
  const colorIds = Array.from(new Set(variants.length ? variants.map((v) => v.colorId).filter(Boolean) : optionColorIds));
  const sizeIds = Array.from(new Set(variants.length ? variants.map((v) => v.sizeId).filter(Boolean) : optionSizeIds));

  // 3. Chuẩn hóa giới tính
  const rawGender = (product.gender || "UNISEX").toUpperCase();
  const gender = ["MEN", "WOMEN", "UNISEX"].includes(rawGender) ? rawGender : "UNISEX";

  // 4. Chuẩn hóa huy hiệu
  const badgeMap = {
    "BEST SELLER": "BEST_SELLER",
    "BEST_SELLER": "BEST_SELLER",
    "NEW": "NEW",
    "SALE": "SALE",
    "LIMITED": "LIMITED",
    "NONE": "NONE",
  };

  const totalStock = product.stockQuantity !== undefined
    ? Number(product.stockQuantity)
    : (variants.length > 0 ? variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0) : 0);

  return {
    name: product.name || "",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    categoryId: product.categoryId || product.category || "tops",
    gender,
    styleIds: product.styleIds || (Array.isArray(product.style) ? product.style : [product.style].filter(Boolean)),
    images: normalizedImages,
    price: String(product.price ?? ""),
    originalPrice: product.originalPrice ? String(product.originalPrice) : "",
    stockQuantity: String(totalStock),
    selectedColorIds: colorIds,
    selectedSizeIds: sizeIds,
    variants,
    material: product.material || product.materials || "",
    fit: product.fit || "",
    pattern: product.pattern || "",
    season: product.season || "",
    origin: product.origin || "Vietnam",
    careInstructions: product.careInstructions || product.care || "",
    slug: product.slug || "",
    metaTitle: product.metaTitle || "",
    metaDescription: product.metaDescription || "",
    status: product.status || "ACTIVE",
    badge: badgeMap[product.badge] || "NONE",
    isFeatured: !!product.isFeatured,
  };
}

export default function ProductForm({ mode, initialProduct, onSave }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [allStyles, setAllStyles] = useState([]);

  useEffect(() => {
    let active = true;
    getCategories().then((cats) => {
      if (active && Array.isArray(cats)) setCategories(cats);
    });
    getStyles().then((sts) => {
      if (active && Array.isArray(sts)) setAllStyles(sts);
    });
    return () => {
      active = false;
    };
  }, []);

  const [form, setForm] = useState(() => (initialProduct ? productToForm(initialProduct) : emptyForm()));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState({});
  const [variantErrors, setVariantErrors] = useState({});
  const [submitting, setSubmitting] = useState(null); // "draft" | "publish" | "save" | null

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(value) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  function handleSlugChange(value) {
    setSlugTouched(true);
    set("slug", value);
  }

  const discountPercent = useMemo(() => {
    const price = Number(form.price);
    const original = Number(form.originalPrice);
    if (!original || original <= price) return 0;
    return Math.round(((original - price) / original) * 100);
  }, [form.price, form.originalPrice]);

  function handleTotalStockChange(val) {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setForm((prev) => {
      let updatedVariants = prev.variants;
      if (prev.variants && prev.variants.length > 0) {
        const count = prev.variants.length;
        const base = Math.floor(num / count);
        let rem = num % count;
        updatedVariants = prev.variants.map((v) => {
          const extra = rem > 0 ? 1 : 0;
          if (rem > 0) rem -= 1;
          return { ...v, stockQuantity: base + extra };
        });
      }
      return {
        ...prev,
        stockQuantity: val,
        variants: updatedVariants,
      };
    });
  }

  function handleVariantsChange(nextVariants) {
    const sumStock = (nextVariants || []).reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);
    setForm((prev) => ({
      ...prev,
      variants: nextVariants,
      stockQuantity: String(sumStock),
    }));
  }

  const skuPrefix = useMemo(() => suggestSkuPrefix(form.name || "Product"), [form.name]);

  async function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Product name is required.";
    if (!form.description.trim()) nextErrors.description = "Product description is required.";
    if (!form.categoryId) nextErrors.categoryId = "Category is required.";
    if (!form.gender) nextErrors.gender = "Gender is required.";

    if (form.price === "" || form.price === null) {
      nextErrors.price = "Price is required.";
    } else if (!Number.isInteger(Number(form.price)) || Number(form.price) <= 0) {
      nextErrors.price = "Price must be a positive whole number.";
    }
    if (form.originalPrice !== "" && (!Number.isInteger(Number(form.originalPrice)) || Number(form.originalPrice) < 0)) {
      nextErrors.originalPrice = "Original price must be a non-negative whole number.";
    }
    if (form.stockQuantity === "" || form.stockQuantity === null || Number(form.stockQuantity) < 0) {
      nextErrors.stockQuantity = "Stock quantity cannot be negative.";
    }

    if (form.images.length === 0) nextErrors.images = "At least 1 image is required.";
    const hasExistingVariants = Array.isArray(initialProduct?.variants) && initialProduct.variants.length > 0;
    if (form.variants.length === 0 && (mode === "create" || hasExistingVariants)) {
      nextErrors.variants = "At least 1 variant is required.";
    }

    const nextVariantErrors = {};
    const seenSku = new Map();
    for (const v of form.variants) {
      const rowErr = {};
      const sku = (v.sku || "").trim();
      if (!(v.colorName || v.colorId)) {
        rowErr.color = "Color is required.";
      }
      if (!(v.sizeName || v.sizeId)) {
        rowErr.size = "Size is required.";
      }
      if (!sku) {
        rowErr.sku = "SKU is required.";
      } else {
        const key = sku.toLowerCase();
        if (seenSku.has(key)) {
          rowErr.sku = "Duplicate SKU in this product.";
          nextVariantErrors[seenSku.get(key)] = { ...(nextVariantErrors[seenSku.get(key)] || {}), sku: "Duplicate SKU in this product." };
        }
        seenSku.set(key, v.id);
      }
      if (!Number.isInteger(Number(v.stockQuantity)) || Number(v.stockQuantity) < 0 || v.stockQuantity === "" || v.stockQuantity === null) {
        rowErr.stock = "Stock cannot be negative.";
      }
      if (!Number.isInteger(Number(v.price)) || Number(v.price) <= 0) {
        rowErr.price = "Variant price must be a positive whole number.";
      }
      if (Object.keys(rowErr).length) nextVariantErrors[v.id] = { ...(nextVariantErrors[v.id] || {}), ...rowErr };
    }

    // Kiểm tra trùng SKU với các sản phẩm khác trong hệ thống.
    const excludeId = mode === "edit" && initialProduct ? initialProduct.id : null;
    for (const v of form.variants) {
      const sku = (v.sku || "").trim();
      if (!sku || nextVariantErrors[v.id]?.sku) continue;
      const taken = await isSkuTaken(sku, excludeId);
      if (taken) {
        nextVariantErrors[v.id] = { ...(nextVariantErrors[v.id] || {}), sku: "SKU already exists." };
      }
    }

    setErrors(nextErrors);
    setVariantErrors(nextVariantErrors);

    return Object.keys(nextErrors).length === 0 && Object.keys(nextVariantErrors).length === 0;
  }

  function buildPayload(finalStatus) {
    const rawImages = form.images || [];
    const imageUrls = rawImages
      .map((img, index) => ({
        url: typeof img === "string" ? img : img.url || "",
        isPrimary: typeof img === "string" ? index === 0 : !!img.isPrimary,
        displayOrder: typeof img === "string" ? index + 1 : Number(img.displayOrder) || index + 1,
      }))
      .filter((image) => image.url)
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.displayOrder - b.displayOrder)
      .map((image) => image.url);

    const badgeValue =
      form.badge === "BEST_SELLER"
        ? "BEST SELLER"
        : form.badge === "NONE"
        ? null
        : form.badge;

    // Tổng hợp đầy đủ tất cả các kích cỡ đã chọn và từ các biến thể
    const resolvedSizes = Array.from(
      new Set([
        ...(form.selectedSizeIds || []).map((sid) => getSizeById(sid)?.name || String(sid).replace(/^size-/, "").toUpperCase()),
        ...form.variants.map((v) => v.sizeName || (getSizeById(v.sizeId)?.name) || v.sizeId),
      ].filter(Boolean))
    );

    // Tổng hợp đầy đủ tất cả các màu đã chọn và từ các biến thể
    const resolvedColors = Array.from(
      new Set([
        ...(form.selectedColorIds || []).map((cid) => getColorById(cid)?.name || String(cid).replace(/^color-/, "")),
        ...form.variants.map((v) => v.colorName || (getColorById(v.colorId)?.name) || v.colorId),
      ].filter(Boolean))
    );

    // Tính tổng tồn kho chính xác từ các biến thể
    const computedStock =
      form.variants && form.variants.length > 0
        ? form.variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0)
        : Math.max(0, parseInt(form.stockQuantity, 10) || 0);

    return {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      description: form.description,
      shortDescription: form.shortDescription,
      categoryId: form.categoryId,
      category: form.categoryId,
      gender: (form.gender || "unisex").toLowerCase(),
      styleIds: form.styleIds,
      style: form.styleIds,
      images: imageUrls,
      price: Number(form.price) || 0,
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      stockQuantity: computedStock,
      material: form.material,
      materials: form.material,
      fit: form.fit,
      pattern: form.pattern,
      season: form.season,
      origin: form.origin,
      careInstructions: form.careInstructions,
      care: form.careInstructions,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      badge: badgeValue,
      isFeatured: form.isFeatured,
      status: finalStatus,
      colors: resolvedColors,
      sizes: resolvedSizes,
      ...(form.variants.length > 0
        ? { variants: form.variants.map((v) => ({ ...v, sku: (v.sku || "").trim() })) }
        : {}),
    };
  }

  async function handleSubmit(kind) {
    setSubmitting(kind);
    try {
      const valid = await validate();
      if (!valid) {
        showToast("Vui lòng kiểm tra lại thông tin còn thiếu.", "error");
        return;
      }

      const finalStatus = kind === "draft" ? "DRAFT" : kind === "publish" ? "ACTIVE" : form.status;
      const payload = buildPayload(finalStatus);
      await onSave(payload);
      showToast(
        kind === "draft" ? "Đã lưu bản nháp sản phẩm." : kind === "publish" ? "Đã đăng sản phẩm." : "Đã lưu thay đổi.",
        "success"
      );
      router.push("/admin/products");
    } catch (err) {
      showToast(err?.message || "Có lỗi xảy ra, vui lòng thử lại.", "error");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Basic Information</h2>
          <div className={styles.fieldStack}>
            <TextField
              label="Product Name"
              required
              value={form.name}
              onChange={handleNameChange}
              error={errors.name}
              placeholder="Essential Cotton T-Shirt"
            />
            <TextField
              label="Short Description"
              value={form.shortDescription}
              onChange={(v) => set("shortDescription", v)}
              placeholder="Áo thun cotton cơ bản, dễ phối đồ"
            />
            <TextAreaField
              label="Description"
              required
              value={form.description}
              onChange={(v) => set("description", v)}
              rows={5}
            />
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Category &amp; Style</h2>
          <div className={styles.fieldStack}>
            <div className={styles.fieldRow}>
              <CategorySelector categories={categories} value={form.categoryId} onChange={(v) => set("categoryId", v)} error={errors.categoryId} />
              <div className={fieldStyles.field}>
                <label className={fieldStyles.label}>
                  Gender <span className={fieldStyles.required}>*</span>
                </label>
                <div className={fieldStyles.pillGroup} role="radiogroup" aria-label="Gender">
                  {GENDERS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={form.gender === g.id}
                      className={`${fieldStyles.pill} ${form.gender === g.id ? fieldStyles.pillActive : ""}`}
                      onClick={() => set("gender", g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                {errors.gender ? <p className={fieldStyles.errorText}>{errors.gender}</p> : null}
              </div>
            </div>
            <StyleSelector styleOptions={allStyles} value={form.styleIds} onChange={(v) => set("styleIds", v)} />
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Product Images</h2>
          <ImageUploader
            images={form.images}
            onChange={(updater) => setForm((prev) => ({ ...prev, images: typeof updater === "function" ? updater(prev.images) : updater }))}
            error={errors.images}
          />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Pricing &amp; Inventory</h2>
          <div className={styles.fieldRow}>
            <TextField
              label="Price (Giá bán)"
              required
              type="number"
              value={form.price}
              onChange={(v) => set("price", v)}
              error={errors.price}
              placeholder="299000"
            />
            <TextField
              label="Original Price (Giá gốc)"
              type="number"
              value={form.originalPrice}
              onChange={(v) => set("originalPrice", v)}
              error={errors.originalPrice}
              placeholder="399000"
            />
            <TextField
              label="Total Stock (Tổng tồn kho)"
              required
              type="number"
              value={form.stockQuantity}
              onChange={handleTotalStockChange}
              error={errors.stockQuantity}
              placeholder="0"
            />
          </div>
          {form.price ? (
            <div className={styles.pricePreview}>
              {form.originalPrice && Number(form.originalPrice) > Number(form.price) ? (
                <span className={styles.originalPrice}>{formatVnd(form.originalPrice)}</span>
              ) : null}
              <span className={styles.finalPrice}>{formatVnd(form.price)}</span>
              {discountPercent > 0 ? <span className={styles.discountTag}>{discountPercent}% OFF</span> : null}
            </div>
          ) : null}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Product Variants</h2>
          <VariantEditor
            selectedColorIds={form.selectedColorIds}
            onChangeSelectedColorIds={(v) => set("selectedColorIds", v)}
            selectedSizeIds={form.selectedSizeIds}
            onChangeSelectedSizeIds={(v) => set("selectedSizeIds", v)}
            variants={form.variants}
            onChangeVariants={handleVariantsChange}
            skuPrefix={skuPrefix}
            basePrice={Number(form.price) || 0}
            errors={variantErrors}
            generalError={errors.variants}
          />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Product Details</h2>
          <div className={styles.fieldGrid2}>
            <TextField label="Material" value={form.material} onChange={(v) => set("material", v)} placeholder="100% Cotton" />
            <TextField label="Fit" value={form.fit} onChange={(v) => set("fit", v)} placeholder="Regular Fit" />
            <TextField label="Pattern" value={form.pattern} onChange={(v) => set("pattern", v)} placeholder="Plain" />
            <TextField label="Season" value={form.season} onChange={(v) => set("season", v)} placeholder="Spring/Summer" />
            <TextField label="Origin" value={form.origin} onChange={(v) => set("origin", v)} placeholder="Vietnam" />
          </div>
          <TextAreaField
            label="Care Instructions"
            value={form.careInstructions}
            onChange={(v) => set("careInstructions", v)}
            rows={3}
          />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>SEO</h2>
          <div className={styles.fieldStack}>
            <TextField label="Slug" value={form.slug} onChange={handleSlugChange} placeholder="essential-cotton-t-shirt" />
            <TextField label="Meta Title" value={form.metaTitle} onChange={(v) => set("metaTitle", v)} />
            <TextAreaField label="Meta Description" value={form.metaDescription} onChange={(v) => set("metaDescription", v)} rows={2} />
          </div>
        </section>
      </div>

      <div className={styles.sidebar}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Visibility</h2>
          <div className={styles.fieldStack}>
            <div className={fieldStyles.field}>
              <label className={fieldStyles.label} htmlFor="status-select">
                Status
              </label>
              <div className={fieldStyles.selectWrap}>
                <select
                  id="status-select"
                  className={fieldStyles.select}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <IconChevronDown size={16} className={fieldStyles.selectIcon} />
              </div>
            </div>

            <div className={fieldStyles.field}>
              <label className={fieldStyles.label} htmlFor="badge-select">
                Badge
              </label>
              <div className={fieldStyles.selectWrap}>
                <select
                  id="badge-select"
                  className={fieldStyles.select}
                  value={form.badge}
                  onChange={(e) => set("badge", e.target.value)}
                >
                  {BADGES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <IconChevronDown size={16} className={fieldStyles.selectIcon} />
              </div>
            </div>

            <div className={styles.switchRow}>
              <div>
                <p className={fieldStyles.label}>Featured</p>
                <p className={fieldStyles.hint}>Hiển thị nổi bật trên trang chủ.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isFeatured}
                className={`${styles.switch} ${form.isFeatured ? styles.switchOn : ""}`}
                onClick={() => set("isFeatured", !form.isFeatured)}
              >
                <span className={styles.switchKnob} />
              </button>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.actionsCard}`}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.push("/admin/products")} disabled={!!submitting}>
            Cancel
          </button>

          {mode === "edit" ? (
            <button type="button" className={styles.primaryBtn} onClick={() => handleSubmit("save")} disabled={!!submitting}>
              {submitting === "save" ? "Saving…" : "Save Changes"}
            </button>
          ) : (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={() => handleSubmit("draft")} disabled={!!submitting}>
                {submitting === "draft" ? "Saving…" : "Save Draft"}
              </button>
              <button type="button" className={styles.primaryBtn} onClick={() => handleSubmit("publish")} disabled={!!submitting}>
                {submitting === "publish" ? "Publishing…" : "Publish Product"}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function formatVnd(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function TextField({ label, required, value, onChange, error, type = "text", placeholder }) {
  return (
    <div className={fieldStyles.field}>
      <label className={fieldStyles.label}>
        {label} {required ? <span className={fieldStyles.required}>*</span> : null}
      </label>
      <input
        type={type}
        className={`${fieldStyles.select} ${error ? fieldStyles.selectError : ""}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className={fieldStyles.errorText}>{error}</p> : null}
    </div>
  );
}

function TextAreaField({ label, required, value, onChange, error, rows = 4 }) {
  return (
    <div className={fieldStyles.field}>
      <label className={fieldStyles.label}>
        {label} {required ? <span className={fieldStyles.required}>*</span> : null}
      </label>
      <textarea
        className={`${fieldStyles.select} ${error ? fieldStyles.selectError : ""}`}
        style={{ resize: "vertical" }}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className={fieldStyles.errorText}>{error}</p> : null}
    </div>
  );
}
