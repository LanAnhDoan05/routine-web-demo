"use client";

import Link from "next/link";
import PlaceholderImage from "@/components/common/PlaceholderImage";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export default function CartItem({ item, editable = true }) {
  const { updateQuantity, removeFromCart } = useCart();
  const itemImg = item.image || item.images?.[0] || "";

  return (
    <div className="cart-item">
      <Link href={`/product/${item.productId}`} className="cart-item-image">
        {itemImg && !itemImg.includes("undefined") ? (
          <img
            src={itemImg}
            alt={item.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = "flex";
              }
            }}
          />
        ) : null}
        <div style={{ display: itemImg ? "none" : "flex", width: "100%", height: "100%" }}>
          <PlaceholderImage label={item.name} ratio="3 / 4" rounded />
        </div>
      </Link>

      <div className="cart-item-info">
        <Link href={`/product/${item.productId}`} style={{ fontWeight: 500 }}>
          {item.name}
        </Link>
        {item.category && (
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {item.category}
          </span>
        )}
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          {item.color} {item.size ? `· Size ${item.size}` : ""}
        </span>
        {editable && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <button
              className="text-link cart-item-remove"
              style={{ borderBottom: "none", color: "var(--color-error)", width: "fit-content" }}
              onClick={() => removeFromCart(item.lineId)}
            >
              Remove
            </button>
            <WishlistButton productId={item.productId} size="sm" />
          </div>
        )}
      </div>

      <div className="cart-item-price">{formatPrice(item.price)}</div>

      <div className="cart-item-qty">
        {editable ? (
          <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
            <button aria-label="Giảm số lượng" style={{ width: 32, height: 32 }} onClick={() => updateQuantity(item.lineId, item.quantity - 1)}>
              −
            </button>
            <span style={{ width: 28, textAlign: "center" }}>{item.quantity}</span>
            <button aria-label="Tăng số lượng" style={{ width: 32, height: 32 }} onClick={() => updateQuantity(item.lineId, item.quantity + 1)}>
              +
            </button>
          </div>
        ) : (
          <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>x{item.quantity}</span>
        )}
      </div>

      <div className="cart-item-total">{formatPrice(item.price * item.quantity)}</div>

      <style>{`
        .cart-item {
          display: grid;
          grid-template-columns: 88px 2fr 1fr 1fr 1fr;
          gap: 16px;
          align-items: center;
          padding: 20px 0;
          border-bottom: 1px solid var(--color-border);
        }
        .cart-item-image {
          display: block;
          width: 88px;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          border-radius: var(--radius-sm);
          background-color: var(--color-bg-secondary, #f8f8f8);
          border: 1px solid var(--color-border, #eaeaea);
          position: relative;
        }
        .cart-item-info { display: flex; flex-direction: column; gap: 2px; }
        .cart-item-price, .cart-item-total { font-size: 14px; }
        @media (max-width: 767px) {
          .cart-item {
            grid-template-columns: 72px 1fr;
            grid-template-areas:
              "image info"
              "image qty"
              "image total";
            row-gap: 8px;
          }
          .cart-item-image {
            grid-area: image;
            width: 72px;
          }
          .cart-item-info { grid-area: info; }
          .cart-item-price { display: none; }
          .cart-item-qty { grid-area: qty; }
          .cart-item-total { grid-area: total; font-weight: 600; }
        }
      `}</style>
    </div>
  );
}
