"use client";

"use client";

import ProductCard from "./ProductCard";
import EmptyState from "@/components/common/EmptyState";
import { useProductCardSettings } from "@/context/ProductCardSettingsContext";

export default function ProductGrid({ products, emptyTitle = "Không tìm thấy sản phẩm", emptyDescription }) {
  const settings = useProductCardSettings();
  if (!products || products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div
      className="grid grid-4"
      style={{
        "--product-columns-desktop": settings.columnsDesktop,
        "--product-columns-tablet": settings.columnsTablet,
        "--product-columns-mobile": settings.columnsMobile,
        "--product-gap-desktop": `${settings.gapDesktop}px`,
        "--product-gap-mobile": `${settings.gapMobile}px`,
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
