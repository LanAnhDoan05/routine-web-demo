"use client";

const options = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" }
];

export default function ProductSort({ value, onChange, currentSort, onSortChange }) {
  const activeValue = value !== undefined ? value : currentSort;
  const handleChange = onChange || onSortChange;

  return (
    <div className="field" style={{ minWidth: 130, maxWidth: "100%" }}>
      <label htmlFor="product-sort" className="visually-hidden">
        Sắp xếp
      </label>
      <select
        id="product-sort"
        className="input"
        value={activeValue}
        onChange={(e) => handleChange?.(e.target.value)}
        style={{ padding: "8px 12px", fontSize: 13, height: "auto" }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            Sort: {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
