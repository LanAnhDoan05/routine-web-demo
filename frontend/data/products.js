// Products data layer
// Note: All mock products have been migrated to MySQL Routine DB.
// Data is dynamically retrieved via API (/api/v1/products).

export const products = [];

export function slugify(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

export function getProductsByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  return products.filter((p) => ids.includes(p.id));
}

export function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category === product.category ||
          (Array.isArray(p.style) && p.style.some((s) => Array.isArray(product.style) && product.style.includes(s))))
    )
    .slice(0, limit);
}

export function totalStock(product) {
  if (!product) return 0;
  if (typeof product.stockQuantity === "number") return product.stockQuantity;
  if (typeof product.availableStock === "number") return product.availableStock;
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);
  }
  return product.stockLevel === "low" ? 5 : product.stockLevel === "out" ? 0 : 50;
}

export function stockStatus(product) {
  const stock = totalStock(product);
  if (stock <= 0) return "OUT_OF_STOCK";
  if (stock <= 15) return "LOW_STOCK";
  return "IN_STOCK";
}

export function isProductOutOfStock(product) {
  if (!product) return false;
  if (product.status === "OUT_OF_STOCK" || product.isOutOfStock === true) return true;
  return totalStock(product) <= 0;
}

export function discountPercent(product) {
  if (!product || !product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

export function primaryImage(product) {
  if (!product) return { url: "/images/placeholder.jpg", alt: "" };
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images.find((img) => img && typeof img === "object" && img.isPrimary) || product.images[0];
    if (typeof first === "string") return { url: first, alt: product.name || "" };
    if (first && first.url) return first;
  }
  if (product.imageUrl) return { url: product.imageUrl, alt: product.name || "" };
  return { url: "/images/placeholder.jpg", alt: product.name || "" };
}
