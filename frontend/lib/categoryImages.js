const CATEGORY_IMAGE_ASSETS = [
  "accessories",
  "blazer",
  "bottoms",
  "jacket",
  "jeans",
  "men",
  "new-arrivals",
  "outerwear",
  "polo",
  "shirt",
  "shorts",
  "sneakers",
  "tops",
  "trousers",
  "tshirt",
  "unisex",
  "women",
];

export function getCategoryImageFallback(category = {}) {
  const slug = String(category.slug || category.id || "").toLowerCase();
  const words = `${slug} ${category.name || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const has = (...terms) => terms.some((term) => words.includes(term));
  let asset = null;

  if (has("new", "arrival", "arrivals") && (has("new", "hang") || words.includes("arrivals"))) asset = "new-arrivals";
  else if (has("men", "nam")) asset = "men";
  else if (has("women", "nu")) asset = "women";
  else if (has("unisex")) asset = "unisex";
  else if (has("accessory", "accessories", "phu", "kien")) asset = "accessories";
  else if (has("outerwear", "outer", "jacket", "coat", "khoac", "ni")) asset = "outerwear";
  else if (has("blazer", "vest")) asset = "blazer";
  else if (has("jean", "jeans", "denim")) asset = "jeans";
  else if (has("trouser", "trousers", "kaki", "quan", "vai", "tay")) asset = "trousers";
  else if (has("short", "shorts")) asset = "shorts";
  else if (has("sneaker", "sneakers", "shoe", "shoes", "giay")) asset = "sneakers";
  else if (has("polo", "len", "knit")) asset = "polo";
  else if (has("tshirt", "tee")) asset = "tshirt";
  else if (has("shirt", "sweater", "so", "mi")) asset = "shirt";
  else if (has("bottom", "bottoms")) asset = "bottoms";
  else if (has("top", "tops", "ao")) asset = "tops";

  if (!asset) {
    const key = slug || String(category.name || "category");
    const hash = Array.from(key).reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0, 7);
    asset = CATEGORY_IMAGE_ASSETS[hash % CATEGORY_IMAGE_ASSETS.length];
  }

  return `/images/categories/${asset}.svg`;
}
