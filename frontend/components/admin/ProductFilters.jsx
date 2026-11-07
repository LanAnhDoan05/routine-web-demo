"use client";

import { IconSearch, IconChevronDown } from "./icons";
import styles from "./ProductFilters.module.css";

const GENDERS = [
  { id: "ALL", label: "All Genders" },
  { id: "MEN", label: "Men" },
  { id: "WOMEN", label: "Women" },
  { id: "UNISEX", label: "Unisex" },
];

const STATUSES = [
  { id: "ALL", label: "All Status" },
  { id: "DRAFT", label: "Draft" },
  { id: "ACTIVE", label: "Active" },
  { id: "INACTIVE", label: "Inactive" },
];

const STOCKS = [
  { id: "ALL", label: "All Stock" },
  { id: "IN_STOCK", label: "In Stock" },
  { id: "LOW_STOCK", label: "Low Stock" },
  { id: "OUT_OF_STOCK", label: "Out of Stock" },
];

export default function ProductFilters({ filters, onChange, categories, styleOptions }) {
  return (
    <div className={styles.wrap}>
      <label className={styles.search}>
        <IconSearch size={16} />
        <input
          type="search"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
          aria-label="Tìm kiếm sản phẩm theo tên hoặc SKU"
        />
      </label>

      <div className={styles.selects}>
        <Select
          value={filters.categoryId}
          onChange={(v) => onChange("categoryId", v)}
          options={[{ id: "ALL", label: "All Categories" }, ...categories.map((c) => ({ id: c.id, label: c.name }))]}
        />
        <Select value={filters.gender} onChange={(v) => onChange("gender", v)} options={GENDERS} />
        <Select
          value={filters.styleId}
          onChange={(v) => onChange("styleId", v)}
          options={[{ id: "ALL", label: "All Styles" }, ...styleOptions.map((s) => ({ id: s.id, label: s.name }))]}
        />
        <Select value={filters.status} onChange={(v) => onChange("status", v)} options={STATUSES} />
        <Select value={filters.stock} onChange={(v) => onChange("stock", v)} options={STOCKS} />
      </div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className={styles.selectWrap}>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <IconChevronDown size={14} className={styles.selectIcon} />
    </div>
  );
}
