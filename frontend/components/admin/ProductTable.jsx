"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";
import { IconMoreVertical, IconEye, IconEdit, IconCopy, IconTrash, IconProducts } from "./icons";
import { totalStock, stockStatus, primaryImage } from "@/data/products";
import { formatCurrency } from "@/lib/format";
import styles from "./ProductTable.module.css";

export default function ProductTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDuplicate,
  onDeleteRequest,
}) {
  const allSelected = products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  if (products.length === 0) {
    return (
      <div className={styles.tableCard}>
        <EmptyState
          icon={<IconProducts size={20} />}
          title="Không tìm thấy sản phẩm"
          description="Thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm."
        />
      </div>
    );
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkCol}>
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả sản phẩm"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                />
              </th>
              <th>Image</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Badge</th>
              <th>Featured</th>
              <th className={styles.actionsCol}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                checked={selectedIds.includes(p.id)}
                onToggleSelect={() => onToggleSelect(p.id)}
                onDuplicate={() => onDuplicate(p)}
                onDeleteRequest={() => onDeleteRequest(p)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductRow({ product, checked, onToggleSelect, onDuplicate, onDeleteRequest }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const categoryName = product.category?.name || product.categoryName || product.category || product.categoryId || "—";
  const stock = totalStock(product);
  const status = stockStatus(product);
  const image = primaryImage(product);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <tr>
      <td className={styles.checkCol}>
        <input type="checkbox" aria-label={`Chọn ${product.name}`} checked={checked} onChange={onToggleSelect} />
      </td>
      <td>
        <img
          src={image.url}
          alt={product.name || ""}
          className={styles.thumb}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/placeholder.jpg";
          }}
        />
      </td>
      <td className={styles.nameCell}>
        <Link href={`/admin/products/${product.id}/edit`} className={styles.productName}>
          {product.name}
        </Link>
        <span className={styles.productSlug}>{product.slug}</span>
      </td>
      <td>{categoryName}</td>
      <td>
        {formatCurrency(product.price)}
        {product.originalPrice && product.originalPrice > product.price ? (
          <span className={styles.strike}>{formatCurrency(product.originalPrice)}</span>
        ) : null}
      </td>
      <td>
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 12,
            background: stock === 0 ? "#fef2f2" : stock <= 15 ? "#fffbeb" : "transparent",
            color: stock === 0 ? "#dc2626" : stock <= 15 ? "#d97706" : "inherit",
          }}
        >
          {stock === 0 ? "0 (Hết hàng)" : stock <= 15 ? `${stock} (Sắp hết)` : stock}
        </span>
      </td>
      <td>
        <StatusBadge value={product.status} />
      </td>
      <td>
        <StatusBadge value={product.badge} />
      </td>
      <td>{product.isFeatured ? "Yes" : "No"}</td>
      <td className={styles.actionsCol}>
        <div className={styles.menuWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={`Thao tác với ${product.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IconMoreVertical size={16} />
          </button>
          {menuOpen ? (
            <div className={styles.menu} role="menu">
              <Link href={`/admin/products/${product.id}/edit`} className={styles.menuItem} role="menuitem">
                <IconEye size={14} /> View
              </Link>
              <Link href={`/admin/products/${product.id}/edit`} className={styles.menuItem} role="menuitem">
                <IconEdit size={14} /> Edit
              </Link>
              <button
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate();
                }}
              >
                <IconCopy size={14} /> Duplicate
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteRequest();
                }}
              >
                <IconTrash size={14} /> Delete
              </button>
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
