"use client";

import { useState } from "react";
import { SearchIcon } from "@/components/common/Icons";

export default function SearchBar({
  initialValue = "",
  onSearch,
  placeholder = "Tìm kiếm sản phẩm, outfit, phong cách...",
  autoFocus = false,
  size = "md"
}) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e) {
    e.preventDefault();
    onSearch?.(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, width: "100%" }}>
      <div style={{ position: "relative", flex: 1 }}>
        <SearchIcon
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-secondary)"
          }}
        />
        <input
          type="search"
          className="input"
          autoFocus={autoFocus}
          style={{
            width: "100%",
            paddingLeft: 42,
            height: size === "lg" ? 52 : 44
          }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Tìm kiếm"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Tìm kiếm
      </button>
    </form>
  );
}
