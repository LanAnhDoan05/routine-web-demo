"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/common/Toast";
import { formatPrice } from "@/lib/format";
import { isProductOutOfStock } from "@/data/products";
import styles from "./InteractiveOutfitCard.module.css";

export default function InteractiveOutfitCard({ outfit }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { isLoggedIn, openAuthPrompt } = useUser();
  const { showToast } = useToast();

  const products = outfit?.products || [];
  // Lưu trạng thái size & color được chọn cho từng sản phẩm trong set
  const [selections, setSelections] = useState(() => {
    const initial = {};
    products.forEach((p) => {
      initial[p.id || p.productId] = {
        size: p.selectedSize || (Array.isArray(p.sizes) ? p.sizes[0] : "M"),
        color: p.selectedColor || (Array.isArray(p.colors) ? p.colors[0] : "Đen"),
      };
    });
    return initial;
  });

  const [adding, setAdding] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);

  const allInWishlist = products.length > 0 && products.every((p) => isInWishlist(p.id || p.productId));

  function handleSaveEntireOutfitToWishlist() {
    if (!isLoggedIn) {
      if (typeof openAuthPrompt === "function") {
        openAuthPrompt("Vui lòng đăng nhập để lưu set đồ vào danh sách yêu thích");
      } else {
        showToast("Vui lòng đăng nhập để lưu set đồ yêu thích!");
      }
      return;
    }
    setSavingWishlist(true);
    let count = 0;
    products.forEach((p) => {
      const pid = p.id || p.productId;
      if (pid) {
        addToWishlist(pid);
        count++;
      }
    });
    setSavingWishlist(false);
    showToast(`❤️ Đã lưu ${count} món trong set đồ vào danh sách yêu thích!`);
  }

  function handleSizeChange(prodId, size) {
    setSelections((prev) => ({
      ...prev,
      [prodId]: { ...(prev[prodId] || {}), size },
    }));
  }

  function handleColorChange(prodId, color) {
    setSelections((prev) => ({
      ...prev,
      [prodId]: { ...(prev[prodId] || {}), color },
    }));
  }

  // 1-Click thêm toàn bộ set đồ vào giỏ hàng
  function handleAddEntireOutfit() {
    if (products.length === 0) return;
    setAdding(true);

    let addedCount = 0;
    products.forEach((p) => {
      const pid = p.id || p.productId;
      const sel = selections[pid] || {};
      const success = addToCart(p, {
        size: sel.size,
        color: sel.color,
        quantity: 1,
      });
      if (success !== false) addedCount++;
    });

    setAdding(false);
    if (addedCount > 0) {
      showToast(`✨ Đã thêm trọn bộ ${addedCount} sản phẩm vào giỏ hàng!`);
    }
  }

  // Thêm lẻ 1 sản phẩm
  function handleAddSingleItem(p) {
    if (isProductOutOfStock(p)) {
      showToast(`Sản phẩm "${p.name}" hiện đã hết hàng.`);
      return;
    }
    const pid = p.id || p.productId;
    const sel = selections[pid] || {};
    const success = addToCart(p, {
      size: sel.size,
      color: sel.color,
      quantity: 1,
    });
    if (success !== false) {
      showToast(`Đã thêm "${p.name}" (${sel.size || "M"} - ${sel.color || "Đen"}) vào giỏ hàng!`);
    }
  }

  const total = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  return (
    <div className={styles.interactiveOutfitCard}>
      <div className={styles.outfitCardHeader}>
        <div>
          <span className={styles.outfitBadge}>{outfit.style ? outfit.style.toUpperCase() : "OUTFIT"}</span>
          <h3 className={styles.outfitTitle}>{outfit.title || outfit.name || "Bộ phối thời trang Routine"}</h3>
        </div>
        <span className={styles.outfitItemCount}>{products.length} món đồ</span>
      </div>

      <div className={styles.outfitItemsList}>
        {products.map((item) => {
          const pid = item.id || item.productId;
          const isItemOutOfStock = isProductOutOfStock(item);
          const sel = selections[pid] || {};
          const sizes = Array.isArray(item.sizes) ? item.sizes : ["S", "M", "L", "XL"];
          const colors = Array.isArray(item.colors) ? item.colors : ["Đen", "Trắng", "Xám"];

          return (
            <div key={pid} className={styles.outfitItemRow}>
              <Link href={`/product/${pid}`} className={styles.outfitItemThumb} style={{ position: "relative" }}>
                <img
                  src={item.image || "/images/placeholder.svg"}
                  alt={item.name}
                  style={{
                    filter: isItemOutOfStock ? "grayscale(40%) blur(1px) opacity(0.65)" : "none"
                  }}
                />
                {isItemOutOfStock && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      left: 2,
                      right: 2,
                      background: "rgba(18, 18, 18, 0.8)",
                      color: "#ffffff",
                      fontSize: 9,
                      fontWeight: 700,
                      textAlign: "center",
                      padding: "2px 0",
                      borderRadius: 2
                    }}
                  >
                    Hết hàng
                  </span>
                )}
              </Link>

              <div className={styles.outfitItemInfo}>
                <Link href={`/product/${pid}`} className={styles.outfitItemName}>
                  {item.name}
                </Link>
                <div className={styles.outfitItemPrice}>
                  {formatPrice(item.price)}
                  {isItemOutOfStock && (
                    <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600, marginLeft: 6 }}>
                      (Hết hàng)
                    </span>
                  )}
                </div>

                <div className={styles.outfitItemSelectors}>
                  <div className={styles.selectorGroup}>
                    <label>Size:</label>
                    <select
                      value={sel.size}
                      onChange={(e) => handleSizeChange(pid, e.target.value)}
                      className={styles.miniSelect}
                      disabled={isItemOutOfStock}
                    >
                      {sizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.selectorGroup}>
                    <label>Màu:</label>
                    <select
                      value={sel.color}
                      onChange={(e) => handleColorChange(pid, e.target.value)}
                      className={styles.miniSelect}
                      disabled={isItemOutOfStock}
                    >
                      {colors.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className={styles.btnAddSingle}
                    onClick={() => handleAddSingleItem(item)}
                    disabled={isItemOutOfStock}
                    style={{
                      opacity: isItemOutOfStock ? 0.5 : 1,
                      cursor: isItemOutOfStock ? "not-allowed" : "pointer"
                    }}
                    title={isItemOutOfStock ? "Sản phẩm đã hết hàng" : "Thêm riêng món này"}
                  >
                    {isItemOutOfStock ? "Hết hàng" : "+ Thêm món này"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.outfitCardFooter}>
        <div className={styles.outfitTotal}>
          <span className={styles.totalLabel}>Tổng set đồ:</span>
          <span className={styles.totalAmount}>{formatPrice(total)}</span>
        </div>

        <div className={styles.footerActions}>
          <button
            type="button"
            className={`${styles.btnSaveWishlist} ${allInWishlist ? styles.isSaved : ""}`}
            onClick={handleSaveEntireOutfitToWishlist}
            disabled={savingWishlist}
            title="Lưu trọn bộ vào danh sách yêu thích"
          >
            <span>{allInWishlist ? "❤️" : "🤍"}</span>
            <span>{allInWishlist ? "Đã lưu set đồ" : "Lưu set đồ"}</span>
          </button>

          <button
            type="button"
            className={`btn btn-primary ${styles.btnAddAll}`}
            onClick={handleAddEntireOutfit}
            disabled={adding}
          >
            {adding ? "Đang thêm..." : "🛍️ Mua trọn bộ"}
          </button>
        </div>
      </div>
    </div>
  );
}
