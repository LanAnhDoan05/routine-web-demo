import { getColorById } from "@/data/colors";
import { getSizeById } from "@/data/sizes";

// Gợi ý tiền tố SKU từ tên sản phẩm, vd. "Essential Cotton T-Shirt" -> "ECT".
export function suggestSkuPrefix(name) {
  const letters = (name || "")
    .split(" ")
    .filter((w) => /^[A-Za-zÀ-ỹ]/.test(w))
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
  return letters || "SKU";
}

const COLOR_ABBREVIATIONS = {
  Black: "BLK",
  White: "WHT",
  Grey: "GRY",
  Navy: "NVY",
  Beige: "BEG",
  Olive: "OLV",
  Brown: "BRN",
  Cream: "CRM",
  "Denim Blue": "DNM",
  Red: "RED",
  Burgundy: "BGD",
  Pink: "PNK",
  Blue: "BLU",
  "Light Blue": "LBL",
  Green: "GRN",
  Yellow: "YEL",
  Orange: "ORG",
  Khaki: "KHK",
  Purple: "PUR",
  Charcoal: "CHR",
};

function normalizeLetters(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

function colorCode(colorId) {
  const color = getColorById(colorId);
  if (color) {
    if (COLOR_ABBREVIATIONS[color.name]) return COLOR_ABBREVIATIONS[color.name];
    const cleanName = normalizeLetters(color.name);
    if (cleanName.length >= 3) return cleanName.slice(0, 3);
  }
  if (colorId) {
    const clean = normalizeLetters(String(colorId).replace(/^color-/, ""));
    if (clean.includes("BLACK") || clean.includes("DEN")) return "BLK";
    if (clean.includes("WHITE") || clean.includes("TRANG")) return "WHT";
    if (clean.includes("GREY") || clean.includes("XAM")) return "GRY";
    if (clean.includes("NAVY")) return "NVY";
    if (clean.includes("RED") || clean.includes("DO")) return "RED";
    if (clean.includes("BLUE")) return "BLU";
    if (clean.includes("GREEN")) return "GRN";
    if (clean.includes("YELLOW") || clean.includes("VANG")) return "YEL";
    if (clean.includes("PINK") || clean.includes("HONG")) return "PNK";
    return clean.slice(0, 3) || "COL";
  }
  return "COL";
}

function sizeCode(sizeId) {
  const size = getSizeById(sizeId);
  if (size) return size.name.toUpperCase();
  if (sizeId) {
    const clean = String(sizeId).replace(/^size-/, "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    return clean || "F";
  }
  return "F";
}

// Sinh SKU cho một biến thể chuẩn: [MÃ SẢN PHẨM]-[MÃ MÀU]-[KÍCH CỠ] (vd: CLA-BLK-S, CLA-WHT-M)
export function buildVariantSku(prefix, sequence, colorId, sizeId) {
  const cCode = colorCode(colorId);
  const sCode = sizeCode(sizeId);
  const prf = (prefix || "PRD").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4) || "PRD";
  return `${prf}-${cCode}-${sCode}`;
}
