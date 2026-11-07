export function toColorSlug(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function colorSwatch(name) {
  if (!name) return "#cccccc";
  const n = toColorSlug(name);
  const map = {
    black: "#111111",
    den: "#111111",
    white: "#ffffff",
    trang: "#ffffff",
    grey: "#9a9a9a",
    gray: "#9a9a9a",
    xam: "#9a9a9a",
    ghi: "#9a9a9a",
    navy: "#1f2a44",
    beige: "#e4d3b8",
    be: "#e4d3b8",
    olive: "#6b6e3a",
    reu: "#6b6e3a",
    "xanh-reu": "#6b6e3a",
    brown: "#6b4a34",
    nau: "#6b4a34",
    cream: "#f1ead8",
    kem: "#f1ead8",
    denim: "#3e5c76",
    "denim-blue": "#3e5c76",
    red: "#d9383a",
    do: "#d9383a",
    "do-do": "#800020",
    burgundy: "#800020",
    maroon: "#800020",
    pink: "#e8a598",
    hong: "#e8a598",
    blue: "#2563eb",
    "xanh-duong": "#2563eb",
    "light-blue": "#a9c4de",
    "xanh-nhat": "#a9c4de",
    green: "#2e7d32",
    "xanh-la": "#2e7d32",
    yellow: "#eab308",
    vang: "#eab308",
    orange: "#f97316",
    cam: "#f97316",
    khaki: "#a89f7a",
    kaki: "#a89f7a",
    purple: "#7c3aed",
    tim: "#7c3aed",
    charcoal: "#333333",
    "than-chi": "#333333",
  };
  return map[n] || "#cccccc";
}

export const colors = [
  { id: "color-black", name: "Black", hexCode: "#111111", status: "ACTIVE" },
  { id: "color-white", name: "White", hexCode: "#FFFFFF", status: "ACTIVE" },
  { id: "color-grey", name: "Grey", hexCode: "#9a9a9a", status: "ACTIVE" },
  { id: "color-navy", name: "Navy", hexCode: "#1f2a44", status: "ACTIVE" },
  { id: "color-beige", name: "Beige", hexCode: "#e4d3b8", status: "ACTIVE" },
  { id: "color-olive", name: "Olive", hexCode: "#6b6e3a", status: "ACTIVE" },
  { id: "color-brown", name: "Brown", hexCode: "#6b4a34", status: "ACTIVE" },
  { id: "color-cream", name: "Cream", hexCode: "#f1ead8", status: "ACTIVE" },
  { id: "color-denim", name: "Denim Blue", hexCode: "#3e5c76", status: "ACTIVE" },
  { id: "color-red", name: "Red", hexCode: "#d9383a", status: "ACTIVE" },
  { id: "color-burgundy", name: "Burgundy", hexCode: "#800020", status: "ACTIVE" },
  { id: "color-pink", name: "Pink", hexCode: "#e8a598", status: "ACTIVE" },
  { id: "color-blue", name: "Blue", hexCode: "#2563eb", status: "ACTIVE" },
  { id: "color-light-blue", name: "Light Blue", hexCode: "#a9c4de", status: "ACTIVE" },
  { id: "color-green", name: "Green", hexCode: "#2e7d32", status: "ACTIVE" },
  { id: "color-yellow", name: "Yellow", hexCode: "#eab308", status: "ACTIVE" },
  { id: "color-orange", name: "Orange", hexCode: "#f97316", status: "ACTIVE" },
  { id: "color-khaki", name: "Khaki", hexCode: "#a89f7a", status: "ACTIVE" },
  { id: "color-purple", name: "Purple", hexCode: "#7c3aed", status: "ACTIVE" },
  { id: "color-charcoal", name: "Charcoal", hexCode: "#333333", status: "ACTIVE" },
];

const customColorsRegistry = new Map();

export function registerColor(color) {
  if (!color || !color.id) return;
  customColorsRegistry.set(color.id.toLowerCase(), {
    id: color.id,
    name: color.name || color.id.replace(/^color-/, ""),
    hexCode: color.hexCode || colorSwatch(color.name || color.id),
    status: color.status || "ACTIVE",
  });
}

export function getColorById(id) {
  if (!id) return null;
  const raw = String(id).trim();
  const needle = raw.toLowerCase();
  const slug = toColorSlug(needle.replace(/^color-/, ""));

  // 1. Kiểm tra trực tiếp trong colors chuẩn
  const directMatch = colors.find((c) => {
    const cId = c.id.toLowerCase();
    const cName = c.name.toLowerCase();
    const cSlug = toColorSlug(c.name);
    return cId === needle || cName === needle || cSlug === slug || cId.replace(/^color-/, "") === slug;
  });
  if (directMatch) return directMatch;

  // 2. Kiểm tra trong registry màu tuỳ biến
  if (customColorsRegistry.has(needle)) {
    return customColorsRegistry.get(needle);
  }
  for (const c of customColorsRegistry.values()) {
    if (c.id.toLowerCase() === needle || c.name.toLowerCase() === needle || toColorSlug(c.name) === slug) {
      return c;
    }
  }

  // 3. Từ đồng nghĩa tiếng Việt phổ biến
  const synonymMap = {
    den: "color-black",
    trang: "color-white",
    xam: "color-grey",
    ghi: "color-grey",
    navy: "color-navy",
    "xanh-navy": "color-navy",
    "xanh-den": "color-navy",
    be: "color-beige",
    kem: "color-cream",
    nau: "color-brown",
    reu: "color-olive",
    "xanh-reu": "color-olive",
    denim: "color-denim",
    "denim-blue": "color-denim",
    bo: "color-denim",
    do: "color-red",
    "do-do": "color-burgundy",
    "do-ruou": "color-burgundy",
    hong: "color-pink",
    "xanh-duong": "color-blue",
    blue: "color-blue",
    "xanh-nhat": "color-light-blue",
    "light-blue": "color-light-blue",
    "xanh-la": "color-green",
    green: "color-green",
    vang: "color-yellow",
    cam: "color-orange",
    kaki: "color-khaki",
    khaki: "color-khaki",
    tim: "color-purple",
    "than-chi": "color-charcoal",
  };

  if (synonymMap[slug]) {
    const matched = colors.find((c) => c.id === synonymMap[slug]);
    if (matched) return matched;
  }

  // 4. Nếu là màu tự định nghĩa chưa có trong từ điển, tự tạo một đối tượng màu hợp lệ và cache lại
  const cleanName = raw.replace(/^color-/, "").replace(/[-_]+/g, " ").trim();
  const formattedName = cleanName
    ? cleanName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Custom";

  const dynamicColor = {
    id: raw.startsWith("color-") ? raw : `color-${slug || "custom"}`,
    name: formattedName,
    hexCode: colorSwatch(cleanName),
    status: "ACTIVE",
  };

  registerColor(dynamicColor);
  return dynamicColor;
}
