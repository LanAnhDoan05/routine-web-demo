"use client";

import Link from "next/link";
import PlaceholderImage from "@/components/common/PlaceholderImage";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/common/Toast";
import { formatPrice } from "@/lib/format";
import { getStyleBySlug } from "@/data/styles";

export default function OutfitRecommendation({ recommendation }) {
  const { addOutfitToCart } = useCart();
  const { showToast } = useToast();
  const { outfit, products, total } = recommendation;
  const styleInfo = getStyleBySlug(outfit.style);

  function handleAddAll() {
    addOutfitToCart(products);
    showToast("Đã thêm cả outfit vào giỏ hàng.");
  }

  return (
    <div className="ai-recommendation">
      <PlaceholderImage label={outfit.name} ratio="1 / 1" rounded />
      <div style={{ paddingTop: 16 }}>
        <span className="badge badge-outline">{styleInfo?.name || outfit.style}</span>
        <h3 style={{ fontSize: 18, margin: "8px 0 12px" }}>{outfit.name}</h3>
        <ul style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {products.map((p) => (
            <li key={p.id} style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              {p.name}
            </li>
          ))}
        </ul>
        <p style={{ fontWeight: 600, marginBottom: 16 }}>{formatPrice(total)}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/outfit/${outfit.id}`} className="btn btn-secondary" style={{ flex: 1 }}>
            View Outfit
          </Link>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddAll}>
            Add All To Cart
          </button>
        </div>
      </div>
      <style>{`
        .ai-recommendation {
          max-width: 380px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
        }
      `}</style>
    </div>
  );
}
