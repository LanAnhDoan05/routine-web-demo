"use client";

import Link from "next/link";
import Badge from "@/components/common/Badge";
import PlaceholderImage from "@/components/common/PlaceholderImage";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/common/Toast";
import { formatPrice } from "@/lib/format";
import { getColorById } from "@/data/colors";
import { isProductOutOfStock } from "@/data/products";
import { useProductCardSettings } from "@/context/ProductCardSettingsContext";
import styles from "./ProductCard.module.css";

function resolveColorHex(name = "") {
  const n = String(name).toLowerCase().trim().replace(/^color-/, "");
  const map = {
    black: "#111111",
    den: "#111111",
    "đen": "#111111",
    white: "#ffffff",
    trang: "#ffffff",
    "trắng": "#ffffff",
    grey: "#9a9a9a",
    gray: "#9a9a9a",
    xam: "#9a9a9a",
    "xám": "#9a9a9a",
    beige: "#e4d3b8",
    be: "#e4d3b8",
    navy: "#1f2a44",
    "xanh navy": "#1f2a44",
    blue: "#3b5b92",
    "xanh dương": "#3b5b92",
    brown: "#6b4a34",
    nau: "#6b4a34",
    "nâu": "#6b4a34",
    cream: "#f1ead8",
    kem: "#f1ead8",
    khaki: "#a89f7a",
    olive: "#6b6e3a",
    reu: "#6b6e3a",
    "rêu": "#6b6e3a",
    camel: "#c19a6b",
    green: "#4a5d43",
    "light blue": "#a9c4de",
    denim: "#3e5c76",
    "denim blue": "#3e5c76"
  };
  return map[n] || "#999999";
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const settings = useProductCardSettings();
  const isOutOfStock = isProductOutOfStock(product);
  const showQuickAdd = settings.cardStyle === "quick-buy" || settings.showQuickAdd;
  const cardStyleClass = {
    sale: styles.cardSale,
    minimal: styles.cardMinimal,
    "quick-buy": styles.cardQuickBuy,
  }[settings.cardStyle] || "";
  const showBadge = !(
    (product.badge === "NEW" && !settings.showNewBadge) ||
    (product.badge === "SALE" && !settings.showSaleBadge)
  );
  const isDiscounted = Number(product.originalPrice) > Number(product.price);

  function handleQuickAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      showToast("Sản phẩm hiện đã hết hàng.");
      return;
    }
    addToCart(product);
    showToast("Đã thêm sản phẩm vào giỏ hàng.");
  }

  const firstImg = product.images?.[0];
  const secondImg = product.images?.[1];

  return (
    <Link href={`/product/${product.id}`} className={`${styles.card} ${cardStyleClass}`}>
      <div className={`${styles.imageWrap} ${isOutOfStock ? styles.outOfStockWrap : ""}`}>
        {firstImg ? (
          <img
            src={firstImg}
            alt={product.name}
            style={{ width: "100%", aspectRatio: settings.imageAspectRatio, objectFit: "cover", display: "block" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = "flex";
              }
            }}
          />
        ) : null}
        <div style={{ display: firstImg ? "none" : "flex", width: "100%", height: "100%" }}>
          <PlaceholderImage label={product.name} />
        </div>

        {secondImg && (
          <div className={styles.imageBack}>
            <img
              src={secondImg}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        {isOutOfStock && (
          <div className={styles.outOfStockBadgeCenter}>
            <span>HẾT HÀNG</span>
          </div>
        )}

        {showBadge && (product.badge || isOutOfStock) ? (
          <div className={styles.badgeWrap}>
            <Badge variant={isOutOfStock ? "default" : product.badge === "SALE" ? "sale" : "default"}>
              {isOutOfStock ? "HẾT HÀNG" : product.badge}
            </Badge>
          </div>
        ) : null}
        {settings.showWishlist ? (
          <div className={styles.wishlistWrap}>
            <WishlistButton productId={product.id} size="sm" />
          </div>
        ) : null}
        {!showQuickAdd ? null : isOutOfStock ? (
          <button
            type="button"
            disabled
            className={styles.quickAddDisabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Hết hàng
          </button>
        ) : (
          <button className={`btn btn-primary btn-sm btn-full ${styles.quickAdd}`} onClick={handleQuickAdd}>
            Quick Add
          </button>
        )}
      </div>

      <div className={styles.info}>
        <span className={styles.category}>{product.category}</span>
        <span className={styles.name}>{product.name}</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          <div className="price" style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
            {(!isDiscounted || settings.showSalePrice) ? (
              <span className="price-current">{formatPrice(product.price)}</span>
            ) : null}
            {settings.showOriginalPrice && product.originalPrice && Number(product.originalPrice) > Number(product.price) ? (
              <span className="price-original">{formatPrice(product.originalPrice)}</span>
            ) : null}
            {isOutOfStock && <span className={styles.outOfStockText}>• Hết hàng</span>}
          </div>
          {product.soldCount !== undefined ? (
            <span className={styles.soldCount}>Đã bán {product.soldCount}</span>
          ) : null}
        </div>
        {settings.showColorSwatches && product.colors?.length > 0 && (
          <div className={styles.colors} aria-label={`Màu sắc: ${product.colors.map((c) => (typeof c === "object" ? c.name : c)).join(", ")}`}>
            {product.colors.map((c, idx) => {
              const cKey = typeof c === "object" ? (c.id || c.name || idx) : c;
              const cName = typeof c === "object" ? (c.name || c.colorName || "") : c;
              const cObj = getColorById(cKey) || getColorById(cName);
              const hex = (typeof c === "object" && (c.hexCode || c.hex)) || (cObj ? cObj.hexCode : resolveColorHex(cName));
              const title = cObj ? cObj.name : cName;
              return (
                <span
                  key={cKey}
                  className={styles.colorDot}
                  style={{ background: hex, border: hex.toLowerCase() === "#ffffff" ? "1px solid #ddd" : "none" }}
                  title={title}
                />
              );
            })}
          </div>
        )}
      </div>
    </Link>
  );
}
