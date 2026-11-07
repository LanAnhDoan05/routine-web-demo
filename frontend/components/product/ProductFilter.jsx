"use client";

export const priceRanges = [
  { label: "Dưới 300K", range: [0, 300000] },
  { label: "300K - 600K", range: [300000, 600000] },
  { label: "600K - 1 triệu", range: [600000, 1000000] },
  { label: "Trên 1 triệu", range: [1000000, null] }
];

export function getPriceRangeByLabel(label) {
  return priceRanges.find((p) => p.label === label)?.range || null;
}

function FacetGroup({ title, options, activeValue, onSelect }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="field" style={{ marginBottom: 24 }}>
      <label style={{ fontWeight: 600, color: "var(--color-text)", fontSize: 13 }}>{title}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            className={`chip ${activeValue === opt.value ? "is-active" : ""}`}
            onClick={() => onSelect(activeValue === opt.value ? null : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductFilter({
  facets,
  filters,
  selectedFilters,
  onChange,
  onFilterChange,
  onReset,
}) {
  const activeFilters = filters || selectedFilters || {};
  const handleChange = onChange || onFilterChange || (() => {});
  const { categories = [], sizes = [], colors = [], styles = [] } = facets || {};

  function update(key, value) {
    handleChange({ ...activeFilters, [key]: value });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Filter</span>
        <button type="button" className="text-link" onClick={onReset} style={{ borderBottom: "none" }}>
          Xóa lọc
        </button>
      </div>

      <FacetGroup
        title="Category"
        options={categories.map((c) => ({ label: c, value: c }))}
        activeValue={activeFilters.category}
        onSelect={(v) => update("category", v)}
      />
      <FacetGroup
        title="Size"
        options={sizes.map((s) => ({ label: s, value: s }))}
        activeValue={activeFilters.size}
        onSelect={(v) => update("size", v)}
      />
      <FacetGroup
        title="Color"
        options={colors.map((c) => ({ label: c, value: c }))}
        activeValue={activeFilters.color}
        onSelect={(v) => update("color", v)}
      />
      <FacetGroup
        title="Style"
        options={styles.map((s) => ({ label: s, value: s }))}
        activeValue={activeFilters.style}
        onSelect={(v) => update("style", v)}
      />
      <FacetGroup
        title="Price"
        options={priceRanges.map((p) => ({ label: p.label, value: p.label }))}
        activeValue={activeFilters.priceLabel}
        onSelect={(v) => update("priceLabel", v)}
      />
    </div>
  );
}
