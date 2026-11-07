"use client";

import { useState } from "react";
import PlaceholderImage from "@/components/common/PlaceholderImage";
import ProductCard from "@/components/product/ProductCard";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/common/Toast";
import { formatPrice } from "@/lib/format";
import { getStyleBySlug } from "@/data/styles";

const occasionLabels = {
  everyday: "Everyday",
  office: "Office",
  date: "Date",
  weekend: "Weekend",
  travel: "Travel",
  party: "Party"
};

export default function OutfitDetail({ outfit, products, relatedProducts = [] }) {
  const { addOutfitToCart } = useCart();
  const { showToast } = useToast();
  const total = products.reduce((sum, p) => sum + (p.price || 0), 0);
  const styleInfo = getStyleBySlug(outfit.style);

  const outfitImages = Array.isArray(outfit.images) && outfit.images.length > 0
    ? outfit.images
    : (outfit.coverImage || outfit.image ? [outfit.coverImage || outfit.image] : []);
  const [activeImage, setActiveImage] = useState(outfit.coverImage || outfit.image || outfitImages[0] || "");

  function handleAddAll() {
    const success = addOutfitToCart(products);
    if (success) {
      showToast("Đã thêm cả outfit vào giỏ hàng.");
    }
  }

  function handleSave() {
    showToast("Đã lưu outfit vào wishlist phong cách của bạn.");
  }

  const currentDisplayImg = activeImage || outfit.coverImage || outfit.image;

  return (
    <div>
      <div className="outfit-detail-layout">
        <div>
          {currentDisplayImg ? (
            <div style={{ width: "100%", aspectRatio: "4 / 5", borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative" }}>
              <img
                src={currentDisplayImg}
                alt={outfit.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextSibling) {
                    e.currentTarget.nextSibling.style.display = "flex";
                  }
                }}
              />
              <div style={{ display: "none", width: "100%", height: "100%" }}>
                <PlaceholderImage label={outfit.name} ratio="4 / 5" rounded />
              </div>
            </div>
          ) : (
            <PlaceholderImage label={outfit.name} ratio="4 / 5" rounded />
          )}

          {outfitImages.length > 1 && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
              {outfitImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(imgUrl)}
                  style={{
                    width: 68,
                    height: 85,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    border: (currentDisplayImg === imgUrl) ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                    padding: 0,
                    cursor: "pointer",
                    flexShrink: 0,
                    background: "none",
                  }}
                >
                  <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 style={{ fontSize: 30, marginBottom: 8 }}>{outfit.name}</h1>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span className="badge badge-outline">{styleInfo?.name || outfit.style}</span>
            <span className="badge badge-outline">{occasionLabels[outfit.occasion] || outfit.occasion}</span>
          </div>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: 24, lineHeight: 1.7 }}>
            {outfit.description}
          </p>

          <h2 style={{ fontSize: 15, marginBottom: 12 }}>Products included</h2>
          <ul style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {products.map((p) => (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--color-border)"
                }}
              >
                <span>{p.name}</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{formatPrice(p.price)}</span>
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, fontWeight: 600 }}>
            <span>Total price</span>
            <span>{formatPrice(total)}</span>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddAll}>
              Add All To Cart
            </button>
            <button className="btn btn-secondary" onClick={handleSave}>
              Save Outfit
            </button>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section style={{ marginTop: 64 }}>
          <h2 className="section-title" style={{ marginBottom: 24 }}>
            You may also like
          </h2>
          <div className="grid grid-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <style>{`
        .outfit-detail-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
        }
        @media (max-width: 1023px) {
          .outfit-detail-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
}
