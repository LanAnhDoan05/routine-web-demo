"use client";

import { useEffect, useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/common/Toast";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { StarIcon, ChevronDownIcon } from "@/components/common/Icons";
import { formatPrice } from "@/lib/format";
import { getColorById } from "@/data/colors";
import { getSizeById } from "@/data/sizes";
import { isProductOutOfStock as checkOutOfStock } from "@/data/products";

function AccordionRow({ title, content, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (!textRef.current || !content) return;
    const lineCount = (content || "").split(/\r\n|\r|\n/).length;
    if (lineCount > 9 || textRef.current.scrollHeight > textRef.current.clientHeight + 2) {
      setHasOverflow(true);
    }
  }, [content, open]);

  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
          background: "none",
          border: "none"
        }}
      >
        {title}
        <ChevronDownIcon style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ paddingBottom: 16 }}>
          <div
            ref={textRef}
            style={{
              color: "var(--color-text-secondary)",
              fontSize: 15,
              lineHeight: 1.6,
              whiteSpace: "pre-line",
              display: isExpanded ? "block" : "-webkit-box",
              WebkitLineClamp: isExpanded ? "unset" : 9,
              WebkitBoxOrient: "vertical",
              overflow: isExpanded ? "visible" : "hidden"
            }}
          >
            {content || "Thông tin đang được cập nhật."}
          </div>
          {hasOverflow && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              style={{
                marginTop: 10,
                background: "none",
                border: "none",
                color: "var(--color-primary, #111)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                padding: "4px 0",
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {isExpanded ? (
                <>
                  Thu gọn <ChevronDownIcon style={{ transform: "rotate(180deg)", width: 14, height: 14 }} />
                </>
              ) : (
                <>
                  Ẩn bớt <ChevronDownIcon style={{ width: 14, height: 14 }} />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function colorSwatch(name = "") {
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
  return map[n] || "#cccccc";
}

function resolveColor(c) {
  if (!c) return { label: "Mặc định", hex: "#111111", key: "" };
  if (typeof c === "object") {
    return {
      key: c.id || c.name || "",
      label: c.name || c.colorName || "Mặc định",
      hex: c.hexCode || c.hex || colorSwatch(c.name || c.colorName)
    };
  }
  const found = getColorById(c);
  if (found) {
    return { key: c, label: found.name, hex: found.hexCode };
  }
  const clean = String(c).replace(/^color-/, "");
  return {
    key: c,
    label: clean.charAt(0).toUpperCase() + clean.slice(1),
    hex: colorSwatch(c)
  };
}

function resolveSize(s) {
  if (!s) return "";
  if (typeof s === "object") return s.name || s.sizeName || s.id || "";
  const found = getSizeById(s);
  return found ? found.name : String(s).replace(/^size-/, "").toUpperCase();
}

export default function ProductInfo({ product, isOutOfStock: propOutOfStock }) {
  const isOutOfStock = propOutOfStock ?? checkOutOfStock(product);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    if (product.colors && product.colors.length > 0) {
      if (!selectedColor || !product.colors.includes(selectedColor)) {
        setSelectedColor(product.colors[0]);
      }
    }
  }, [product.colors]);

  function handleAddToCart() {
    if (isOutOfStock) {
      showToast("Sản phẩm hiện đã hết hàng.");
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const colorLabel = resolveColor(selectedColor).label;
    const sizeLabel = selectedSize ? resolveSize(selectedSize) : null;
    const success = addToCart(product, { size: sizeLabel, color: colorLabel, quantity });
    if (success) {
      showToast("Đã thêm sản phẩm vào giỏ hàng.");
    }
  }

  function handleOpenStylist() {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("open-ai-stylist", {
        detail: {
          productId: product.id,
          productName: product.name,
        },
      });
      window.dispatchEvent(event);
    }
  }

  const currentColorObj = resolveColor(selectedColor);

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>{product.name}</h1>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {product.rating ? (
          <>
            <div style={{ display: "flex", gap: 2, color: "var(--color-primary)" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} filled={i < Math.round(product.rating)} />
              ))}
            </div>
            <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              {product.rating.toFixed(1)} ({product.reviewCount || 0} đánh giá)
            </span>
            <span style={{ color: "var(--color-border)", margin: "0 2px" }}>•</span>
          </>
        ) : null}
        <span style={{ fontSize: 14, color: "var(--color-text-secondary)", fontWeight: 500 }}>
          Đã bán {product.soldCount !== undefined ? product.soldCount : 99}
        </span>
      </div>

      <div className="price" style={{ fontSize: 20, marginBottom: isOutOfStock ? 16 : 24, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span className="price-current">{formatPrice(product.price)}</span>
        {product.originalPrice && <span className="price-original">{formatPrice(product.originalPrice)}</span>}
        {isOutOfStock && (
          <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, background: "rgba(220, 38, 38, 0.08)", padding: "2px 8px", borderRadius: 4 }}>
            Hết hàng
          </span>
        )}
      </div>

      {isOutOfStock && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "14px 18px",
            background: "rgba(220, 38, 38, 0.05)",
            border: "1px solid rgba(220, 38, 38, 0.2)",
            borderRadius: "var(--radius-sm, 4px)",
            marginBottom: 24,
            color: "#b91c1c"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            <strong style={{ display: "block", fontSize: 14, marginBottom: 2 }}>TẠM HẾT HÀNG</strong>
            <span style={{ color: "var(--color-text-secondary, #666)" }}>
              Sản phẩm hiện đang tạm hết hàng. Quý khách vui lòng tham khảo các mẫu thời trang khác hoặc quay lại sau.
            </span>
          </div>
        </div>
      )}

      {product.colors?.length > 0 && (
        <div className="field" style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 500 }}>Color: <span style={{ fontWeight: 600 }}>{currentColorObj.label}</span></label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {product.colors.map((color, idx) => {
              const cInfo = resolveColor(color);
              const isSelected = selectedColor === color || (typeof color === "string" && selectedColor === cInfo.label);
              return (
                <button
                  key={typeof color === "string" ? color : cInfo.key || idx}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  aria-label={cInfo.label}
                  aria-pressed={isSelected}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: isSelected ? "2px solid var(--color-primary, #000)" : "1px solid var(--color-border, #ccc)",
                    padding: 3,
                    cursor: "pointer",
                    background: "transparent",
                    transition: "border 0.2s"
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: cInfo.hex,
                      border: cInfo.hex.toLowerCase() === "#ffffff" ? "1px solid #ddd" : "none"
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {product.sizes?.length > 0 && (
        <div className="field" style={{ marginBottom: 8 }}>
          <label style={{ fontWeight: 500 }}>
            Size {sizeError && <span style={{ color: "var(--color-error, red)" }}>— vui lòng chọn size</span>}
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {product.sizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  className={`chip ${isSelected ? "is-active" : ""}`}
                  onClick={() => {
                    if (isOutOfStock) return;
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                  aria-pressed={isSelected}
                  style={{
                    minWidth: 44,
                    height: 38,
                    padding: "0 14px",
                    fontWeight: isSelected ? 600 : 400,
                    opacity: isOutOfStock ? 0.6 : 1,
                    cursor: isOutOfStock ? "not-allowed" : "pointer"
                  }}
                >
                  {resolveSize(size)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button className="text-link" style={{ marginBottom: 24, borderBottom: "none", cursor: "pointer", background: "none" }}>
        Size Guide
      </button>

      <div className="field" style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 500 }}>Quantity</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              opacity: isOutOfStock ? 0.5 : 1,
              pointerEvents: isOutOfStock ? "none" : "auto"
            }}
          >
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              style={{ padding: "8px 14px", border: "none", background: "none", cursor: "pointer" }}
              aria-label="Giảm số lượng"
            >
              -
            </button>
            <span style={{ minWidth: 28, textAlign: "center", fontWeight: 500 }}>{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              style={{ padding: "8px 14px", border: "none", background: "none", cursor: "pointer" }}
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isOutOfStock}
          style={{
            flex: 1,
            height: 48,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.04em",
            background: isOutOfStock ? "var(--color-bg-secondary, #ebebeb)" : undefined,
            color: isOutOfStock ? "var(--color-text-secondary, #888)" : undefined,
            borderColor: isOutOfStock ? "var(--color-border, #d4d4d4)" : undefined,
            cursor: isOutOfStock ? "not-allowed" : "pointer",
            opacity: isOutOfStock ? 0.85 : 1
          }}
          onClick={handleAddToCart}
        >
          {isOutOfStock ? "TẠM HẾT HÀNG" : "Add to Bag"}
        </button>
        <div style={{ display: "flex", alignItems: "center" }}>
          <WishlistButton productId={product.id} size="md" />
        </div>
      </div>

      {/* Complete The Look: Nhờ AI Stylist phối đồ với sản phẩm này */}
      <div style={{ marginBottom: 32 }}>
        <button
          type="button"
          onClick={handleOpenStylist}
          style={{
            width: "100%",
            height: 46,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "var(--radius-sm, 4px)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
            transition: "all 0.2s ease"
          }}
        >
          <span style={{ fontSize: 17 }}>✨</span>
          <span>Nhờ AI Stylist phối đồ với món này</span>
        </button>
      </div>

      <div>
        <AccordionRow title="Product Description" content={product.description} />
      </div>
    </div>
  );
}
