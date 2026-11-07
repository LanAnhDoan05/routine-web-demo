import Link from "next/link";
import PlaceholderImage from "@/components/common/PlaceholderImage";
import { getStyleBySlug } from "@/data/styles";
import { formatPrice } from "@/lib/format";

export default function OutfitCard({ outfit }) {
  const outfitProducts = outfit.products || [];
  const total = outfit.total || outfitProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const styleInfo = getStyleBySlug(outfit.style);
  const coverImg = outfit.coverImage || outfit.image;

  return (
    <Link href={`/outfit/${outfit.id}`} style={{ display: "block" }}>
      {coverImg ? (
        <div style={{ width: "100%", aspectRatio: "4 / 5", borderRadius: "var(--radius-md)", overflow: "hidden", position: "relative" }}>
          <img
            src={coverImg}
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
      <div style={{ paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h3 style={{ fontSize: 16 }}>{outfit.name}</h3>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
            {styleInfo?.name || outfit.style}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
          {outfitProducts.length} sản phẩm · {formatPrice(total)}
        </p>
        <span className="text-link" style={{ marginTop: 12 }}>
          View Outfit
        </span>
      </div>
    </Link>
  );
}
