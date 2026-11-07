"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/layout/SearchBar";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilter, { getPriceRangeByLabel } from "@/components/product/ProductFilter";
import ProductSort from "@/components/product/ProductSort";
import Modal from "@/components/common/Modal";
import { searchProducts, filterProducts, sortProducts } from "@/lib/productService";

const popularSearches = ["T-shirt", "Áo sơ mi", "Quần jeans", "Smart Casual"];
const RECENT_KEY = "routine_recent_searches";

function loadRecent() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
  } catch {
    // ignore storage errors
  }
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container section" />}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState([]);
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("recommended");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
    if (initialQuery) {
      searchProducts(initialQuery).then(setResults);
    } else {
      setResults([]);
    }
  }, [initialQuery]);

  function handleSearch(value) {
    if (!value) return;
    router.push(`/search?q=${encodeURIComponent(value)}`);
    const next = [value, ...recent.filter((r) => r.toLowerCase() !== value.toLowerCase())];
    setRecent(next);
    saveRecent(next);
  }

  const facets = useMemo(() => {
    const categories = [...new Set(results.map((p) => p.category))];
    const sizes = [...new Set(results.flatMap((p) => p.sizes))];
    const colors = [...new Set(results.flatMap((p) => p.colors))];
    const styles = [...new Set(results.flatMap((p) => p.style))];
    return { categories, sizes, colors, styles };
  }, [results]);

  const finalResults = useMemo(() => {
    const priceRange = filters.priceLabel ? getPriceRangeByLabel(filters.priceLabel) : null;
    const filtered = filterProducts(results, { ...filters, priceRange });
    return sortProducts(filtered, sortKey);
  }, [results, filters, sortKey]);

  return (
    <div className="container section">
      <h1 className="section-title" style={{ marginBottom: 24 }}>
        Search
      </h1>

      <div style={{ maxWidth: 640, marginBottom: 32 }}>
        <SearchBar initialValue={query} onSearch={handleSearch} size="lg" />
      </div>

      {!initialQuery && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 640 }}>
          {recent.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, marginBottom: 12 }}>Recent searches</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {recent.map((term) => (
                  <button key={term} className="chip" onClick={() => handleSearch(term)}>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 style={{ fontSize: 14, marginBottom: 12 }}>Popular searches</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {popularSearches.map((term) => (
                <button key={term} className="chip" onClick={() => handleSearch(term)}>
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {initialQuery && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Search results for &ldquo;{initialQuery}&rdquo; — {finalResults.length} products
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary btn-sm search-mobile-filter-btn" onClick={() => setMobileFilterOpen(true)}>
                Filter
              </button>
              <ProductSort value={sortKey} onChange={setSortKey} />
            </div>
          </div>

          <div className="search-layout">
            <aside className="search-filter-sidebar">
              <ProductFilter facets={facets} filters={filters} onChange={setFilters} onReset={() => setFilters({})} />
            </aside>
            <div>
              <ProductGrid
                products={finalResults}
                emptyTitle={`Không tìm thấy kết quả cho "${initialQuery}"`}
                emptyDescription="Hãy thử từ khóa khác hoặc khám phá các sản phẩm nổi bật."
              />
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} title="Filter">
        <ProductFilter facets={facets} filters={filters} onChange={setFilters} onReset={() => setFilters({})} />
      </Modal>

      <style>{`
        .search-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 32px;
        }
        .search-mobile-filter-btn { display: none; }
        @media (max-width: 1023px) {
          .search-layout { grid-template-columns: 1fr; }
          .search-filter-sidebar { display: none; }
          .search-mobile-filter-btn { display: inline-flex; }
        }
      `}</style>
    </div>
  );
}
