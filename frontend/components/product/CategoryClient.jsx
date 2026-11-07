"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilter, { getPriceRangeByLabel } from "@/components/product/ProductFilter";
import ProductSort from "@/components/product/ProductSort";
import Modal from "@/components/common/Modal";
import { getCategoryBySlug } from "@/lib/categoryService";
import { filterProducts, sortProducts, fetchProductsByCategory } from "@/lib/productService";

export default function CategoryClient({ initialCategory, initialProducts = [], slug }) {
  const [category, setCategory] = useState(initialCategory);
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("recommended");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [baseProducts, setBaseProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(!initialCategory && initialProducts.length === 0);

  useEffect(() => {
    let active = true;
    if (!slug) return;

    if (!initialCategory || initialProducts.length === 0) {
      setLoading(true);
      Promise.all([
        getCategoryBySlug(slug),
        fetchProductsByCategory(slug),
      ])
        .then(([cat, items]) => {
          if (active) {
            setCategory(cat || { id: slug, name: slug.toUpperCase(), slug });
            setBaseProducts(items || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [slug, initialCategory, initialProducts]);

  const facets = useMemo(() => {
    const sizes = [...new Set(baseProducts.flatMap((p) => p.sizes || []).filter(Boolean))];
    const colors = [...new Set(baseProducts.flatMap((p) => p.colors || []).filter(Boolean))];
    const styles = [...new Set(baseProducts.flatMap((p) => p.style || p.styles || []).filter(Boolean))];
    return { sizes, colors, styles };
  }, [baseProducts]);

  const finalProducts = useMemo(() => {
    const priceRange = filters.priceLabel ? getPriceRangeByLabel(filters.priceLabel) : null;
    const filtered = filterProducts(baseProducts, { ...filters, priceRange });
    return sortProducts(filtered, sortKey);
  }, [baseProducts, filters, sortKey]);

  if (loading) {
    return (
      <div className="container section" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Đang tải danh mục sản phẩm...</p>
      </div>
    );
  }

  if (!category && !loading) {
    notFound();
  }

  const categoryName = category?.name || slug?.toUpperCase();

  return (
    <div className="container section">
      <nav className="breadcrumb" style={{ marginBottom: 20 }} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="breadcrumb-current">{categoryName}</span>
      </nav>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", textTransform: "uppercase" }}>
          {categoryName}
        </h1>
        {category?.description && (
          <p style={{ color: "var(--color-text-secondary)", marginTop: 6, fontSize: 14 }}>
            {category.description}
          </p>
        )}
      </div>

      <div className="category-toolbar">
        <button
          type="button"
          className="btn btn-secondary mobile-only"
          onClick={() => setMobileFilterOpen(true)}
        >
          Bộ lọc ({Object.keys(filters).length})
        </button>

        <span className="category-count">
          Hiển thị <strong>{finalProducts.length}</strong> sản phẩm
        </span>

        <ProductSort currentSort={sortKey} onSortChange={setSortKey} />
      </div>

      <div className="category-layout">
        <aside className="category-sidebar desktop-only">
          <ProductFilter
            facets={facets}
            filters={filters}
            onChange={setFilters}
          />
        </aside>

        <main className="category-main">
          <ProductGrid products={finalProducts} />
        </main>
      </div>

      {mobileFilterOpen && (
        <Modal title="Bộ lọc sản phẩm" onClose={() => setMobileFilterOpen(false)}>
          <ProductFilter
            facets={facets}
            filters={filters}
            onChange={setFilters}
          />
          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => setMobileFilterOpen(false)}
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        .category-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .category-count {
          color: var(--color-text-secondary);
          font-size: 14px;
        }
        .category-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 40px;
          align-items: start;
          width: 100%;
          min-width: 0;
        }
        .category-main {
          min-width: 0;
          width: 100%;
        }
        @media (max-width: 1023px) {
          .category-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .desktop-only {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .category-toolbar {
            gap: 10px;
          }
          .category-count {
            order: 3;
            width: 100%;
            font-size: 13px;
          }
        }
        @media (min-width: 1024px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
