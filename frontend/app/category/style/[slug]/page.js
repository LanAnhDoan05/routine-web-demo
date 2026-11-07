"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import ProductGrid from "@/components/product/ProductGrid";
import ProductSort from "@/components/product/ProductSort";
import { getStyleById } from "@/lib/styleService";
import { getStyleBySlug } from "@/data/styles";
import { sortProducts, fetchProductsByStyle } from "@/lib/productService";

export default function StyleCategoryPage() {
  const params = useParams();
  const slug = params.slug;
  const [style, setStyle] = useState(() => getStyleBySlug(slug));
  const [styleProducts, setStyleProducts] = useState([]);
  const [sortKey, setSortKey] = useState("recommended");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!slug) return;
    setLoading(true);

    Promise.all([
      getStyleById(slug).catch(() => null),
      fetchProductsByStyle(slug).catch(() => []),
    ]).then(([st, items]) => {
      if (active) {
        if (st) setStyle(st);
        setStyleProducts(items || []);
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [slug]);

  const sorted = useMemo(() => sortProducts(styleProducts, sortKey), [styleProducts, sortKey]);

  if (loading && !style) {
    return (
      <div className="container section" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Đang tải phong cách...</p>
      </div>
    );
  }

  if (!style) {
    notFound();
  }

  return (
    <div className="container section">
      <nav className="breadcrumb" style={{ marginBottom: 20 }} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/#style-inspiration">Style</Link>
        <span>/</span>
        <span className="breadcrumb-current">{style.name}</span>
      </nav>

      <h1 className="section-title" style={{ marginBottom: 8 }}>
        {style.name.toUpperCase()}
      </h1>
      <p className="section-subtitle" style={{ marginBottom: 32 }}>
        {style.description}
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <ProductSort value={sortKey} onChange={setSortKey} />
      </div>

      <ProductGrid products={sorted} emptyTitle="Chưa có sản phẩm thuộc phong cách này" />
    </div>
  );
}
