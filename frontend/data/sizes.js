// Mock data — sẽ được thay bằng bảng `sizes` khi có backend thật.
export const sizes = [
  { id: "size-xs", name: "XS", sizeType: "CLOTHING", sortOrder: 1, status: "ACTIVE" },
  { id: "size-s", name: "S", sizeType: "CLOTHING", sortOrder: 2, status: "ACTIVE" },
  { id: "size-m", name: "M", sizeType: "CLOTHING", sortOrder: 3, status: "ACTIVE" },
  { id: "size-l", name: "L", sizeType: "CLOTHING", sortOrder: 4, status: "ACTIVE" },
  { id: "size-xl", name: "XL", sizeType: "CLOTHING", sortOrder: 5, status: "ACTIVE" },
  { id: "size-xxl", name: "XXL", sizeType: "CLOTHING", sortOrder: 6, status: "ACTIVE" },
  { id: "size-39", name: "39", sizeType: "SHOE", sortOrder: 7, status: "ACTIVE" },
  { id: "size-40", name: "40", sizeType: "SHOE", sortOrder: 8, status: "ACTIVE" },
  { id: "size-41", name: "41", sizeType: "SHOE", sortOrder: 9, status: "ACTIVE" },
  { id: "size-42", name: "42", sizeType: "SHOE", sortOrder: 10, status: "ACTIVE" },
];

export function getSizeById(id) {
  if (!id) return null;
  const needle = String(id).trim().toLowerCase();
  return (
    sizes.find(
      (s) =>
        s.id.toLowerCase() === needle ||
        s.name.toLowerCase() === needle ||
        s.id.replace("size-", "").toLowerCase() === needle
    ) || null
  );
}
