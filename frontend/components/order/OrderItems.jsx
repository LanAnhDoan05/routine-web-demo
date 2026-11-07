import Link from "next/link";
import PlaceholderImage from "@/components/common/PlaceholderImage";
import { formatPrice } from "@/lib/format";

export default function OrderItems({ items }) {
  return (
    <div className="order-items">
      {items.map((item, idx) => {
        const itemImg = item.image || item.images?.[0] || "";
        return (
          <div className="order-item" key={`${item.productId}-${idx}`}>
            <Link href={`/product/${item.productId}`} className="order-item-image">
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
            <div className="order-item-info">
              <Link href={`/product/${item.productId}`} style={{ fontWeight: 500 }}>
                {item.name}
              </Link>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                {item.color} {item.size ? `/ ${item.size}` : ""}
              </span>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Quantity: {item.quantity}</span>
            </div>
            <div className="order-item-price">{formatPrice(item.price)}</div>
          </div>
        );
      })}

      <style>{`
        .order-items {
          display: flex;
          flex-direction: column;
        }
        .order-item {
          display: grid;
          grid-template-columns: 72px 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid var(--color-border);
        }
        .order-item:last-child { border-bottom: none; }
        .order-item-image {
          display: block;
          width: 72px;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          border-radius: var(--radius-sm);
          background-color: var(--color-bg-secondary, #f8f8f8);
          border: 1px solid var(--color-border, #eaeaea);
          position: relative;
        }
        .order-item-info { display: flex; flex-direction: column; gap: 2px; }
        .order-item-price { font-size: 14px; font-weight: 500; }
      `}</style>
    </div>
  );
}
