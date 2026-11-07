"use client";

import { colors as allColors } from "@/data/colors";
import { sizes as allSizes } from "@/data/sizes";
import { getColorById } from "@/data/colors";
import { getSizeById } from "@/data/sizes";
import { buildVariantSku } from "@/lib/sku";
import ColorSelector from "./ColorSelector";
import SizeSelector from "./SizeSelector";
import { IconTrash } from "./icons";
import styles from "./VariantEditor.module.css";

function generateLocalId() {
  return `v-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export default function VariantEditor({
  selectedColorIds = [],
  onChangeSelectedColorIds,
  selectedSizeIds = [],
  onChangeSelectedSizeIds,
  variants = [],
  onChangeVariants,
  skuPrefix,
  basePrice,
  errors = {},
  generalError,
}) {
  function buildVariants(colorIds, sizeIds, currentVariants) {
    const activeColorIds = colorIds && colorIds.length ? colorIds : [null];
    const activeSizeIds = sizeIds && sizeIds.length ? sizeIds : [null];

    const next = [];
    let sequence = 1;
    const seenSkus = new Set();

    for (const colorId of activeColorIds) {
      for (const sizeId of activeSizeIds) {
        const cObj = getColorById(colorId);
        const sObj = getSizeById(sizeId);
        const cCanonicalId = cObj?.id || colorId;
        const sCanonicalId = sObj?.id || sizeId;

        // Tìm biến thể tương ứng nếu đã tồn tại
        const existing = (currentVariants || []).find((v) => {
          const matchColor =
            !colorId ||
            v.colorId === colorId ||
            v.colorId === cCanonicalId ||
            (v.colorName && cObj && v.colorName.toLowerCase() === cObj.name.toLowerCase());
          const matchSize =
            !sizeId ||
            v.sizeId === sizeId ||
            v.sizeId === sCanonicalId ||
            (v.sizeName && sObj && v.sizeName.toUpperCase() === sObj.name.toUpperCase());
          return matchColor && matchSize;
        });

        const freshSku = buildVariantSku(skuPrefix, sequence, cCanonicalId, sCanonicalId);
        let finalSku = freshSku;
        if (existing && existing.sku && !seenSkus.has(existing.sku.toLowerCase()) && !existing.sku.includes("-CO-")) {
          finalSku = existing.sku;
        }

        // Đảm bảo không trùng lặp SKU giữa các biến thể
        if (seenSkus.has(finalSku.toLowerCase())) {
          let counter = 1;
          let candidate = `${finalSku}-${counter}`;
          while (seenSkus.has(candidate.toLowerCase())) {
            counter += 1;
            candidate = `${finalSku}-${counter}`;
          }
          finalSku = candidate;
        }
        seenSkus.add(finalSku.toLowerCase());

        next.push({
          id: existing ? existing.id : generateLocalId(),
          colorId: cCanonicalId,
          colorName: cObj ? cObj.name : (existing?.colorName || (colorId ? String(colorId).replace(/^color-/, "") : "Default")),
          sizeId: sCanonicalId,
          sizeName: sObj ? sObj.name : (existing?.sizeName || (sizeId ? String(sizeId).replace(/^size-/, "").toUpperCase() : "Default")),
          sku: finalSku,
          price: existing && existing.price !== undefined ? existing.price : (basePrice || 0),
          stockQuantity: existing && existing.stockQuantity !== undefined ? existing.stockQuantity : 25,
          status: existing?.status || "ACTIVE",
        });
        sequence += 1;
      }
    }
    return next;
  }

  function handleColorsChange(newColorIds) {
    onChangeSelectedColorIds(newColorIds);
    const updated = buildVariants(newColorIds, selectedSizeIds, variants);
    onChangeVariants(updated);
  }

  function handleSizesChange(newSizeIds) {
    onChangeSelectedSizeIds(newSizeIds);
    const updated = buildVariants(selectedColorIds, newSizeIds, variants);
    onChangeVariants(updated);
  }

  function handleGenerate() {
    const updated = buildVariants(selectedColorIds, selectedSizeIds, variants);
    onChangeVariants(updated);
  }

  function updateVariant(id, field, value) {
    onChangeVariants(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  }

  function removeVariant(id) {
    const next = variants.filter((v) => v.id !== id);
    onChangeVariants(next);
  }

  // Tổng hợp danh sách màu đầy đủ (bao gồm cả các màu tùy chỉnh hiện có trên sản phẩm)
  const mergedColorOptions = [
    ...allColors,
    ...selectedColorIds
      .map(getColorById)
      .filter(Boolean)
      .filter((c) => !allColors.some((ac) => ac.id === c.id)),
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.pickRow}>
        <ColorSelector
          colorOptions={mergedColorOptions}
          value={selectedColorIds}
          onChange={handleColorsChange}
        />
        <SizeSelector
          sizeOptions={allSizes}
          value={selectedSizeIds}
          onChange={handleSizesChange}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <button type="button" className={styles.generateBtn} onClick={handleGenerate} title="Tạo lại danh sách biến thể theo kích cỡ và màu đã chọn">
          Tạo lại danh sách biến thể (Generate)
        </button>
        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
          Đã tạo {variants.length} biến thể ({selectedColorIds.length} màu × {selectedSizeIds.length} size)
        </span>
      </div>

      {generalError ? <p className={styles.generalError}>{generalError}</p> : null}

      {variants.length > 0 ? (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Color</th>
                <th>Size</th>
                <th className={styles.skuCol}>SKU</th>
                <th>Price (VNĐ)</th>
                <th>Stock (Tồn kho)</th>
                <th>Status</th>
                <th aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => {
                const color = getColorById(v.colorId || v.colorName);
                const size = getSizeById(v.sizeId || v.sizeName);
                const rowErrors = errors[v.id] || {};
                return (
                  <tr key={v.id}>
                    <td>
                      {color ? (
                        <span className={styles.colorCell}>
                          <span className={styles.dot} style={{ background: color.hexCode }} />
                          {color.name}
                        </span>
                      ) : (
                        v.colorName || v.colorId || "—"
                      )}
                    </td>
                    <td>{size ? size.name : (v.sizeName || v.sizeId || "—")}</td>
                    <td className={styles.skuCol}>
                      <input
                        type="text"
                        className={`${styles.input} ${rowErrors.sku ? styles.inputError : ""}`}
                        value={v.sku}
                        onChange={(e) => updateVariant(v.id, "sku", e.target.value)}
                        aria-label={`SKU cho ${color?.name || ""} ${size?.name || ""}`}
                      />
                      {rowErrors.sku ? <p className={styles.cellError}>{rowErrors.sku}</p> : null}
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className={`${styles.input} ${styles.numberInput} ${rowErrors.price ? styles.inputError : ""}`}
                        value={v.price}
                        onChange={(e) => updateVariant(v.id, "price", Number(e.target.value))}
                        aria-label="Giá biến thể"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className={`${styles.input} ${styles.numberInput} ${rowErrors.stock ? styles.inputError : ""}`}
                        value={v.stockQuantity}
                        onChange={(e) => updateVariant(v.id, "stockQuantity", Math.max(0, parseInt(e.target.value, 10) || 0))}
                        aria-label="Tồn kho biến thể"
                      />
                      {rowErrors.stock ? <p className={styles.cellError}>{rowErrors.stock}</p> : null}
                    </td>
                    <td>
                      <select
                        className={styles.input}
                        value={v.status}
                        onChange={(e) => updateVariant(v.id, "status", e.target.value)}
                        aria-label="Trạng thái biến thể"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeVariant(v.id)}
                        aria-label="Xoá biến thể"
                        title="Remove variant"
                      >
                        <IconTrash size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.emptyHint}>Chọn Colors và Sizes ở trên để tự động tạo bảng biến thể.</p>
      )}
    </div>
  );
}
