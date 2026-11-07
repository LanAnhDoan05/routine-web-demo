"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import OutfitDetail from "@/components/outfit/OutfitDetail";
import { getOutfitById } from "@/lib/outfitService";
import { fetchProductsByIds, fetchRelatedProducts } from "@/lib/productService";

export default function OutfitDetailPage() {
  const params = useParams();
  const [outfit, setOutfit] = useState(null);
  const [products, setProducts] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!params?.id) return;
      try {
        const data = await getOutfitById(params.id);
        if (!isMounted) return;
        if (!data) {
          setLoading(false);
          return;
        }
        setOutfit(data);

        // If products are already populated in data.products
        let loadedProducts = data.products || [];
        if ((!loadedProducts || loadedProducts.length === 0) && data.productIds?.length) {
          loadedProducts = await fetchProductsByIds(data.productIds);
        }
        if (!isMounted) return;
        setProducts(loadedProducts);

        if (loadedProducts.length > 0) {
          const rel = await fetchRelatedProducts(loadedProducts[0].id, 4);
          if (isMounted) setRelated(rel || []);
        }
      } catch (err) {
        console.error("Failed to load outfit detail:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [params?.id]);

  if (loading) {
    return (
      <div className="container section" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Đang tải thông tin outfit...</p>
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className="container section" style={{ textAlign: "center", padding: "80px 0" }}>
        <h2>Không tìm thấy outfit</h2>
        <p style={{ marginTop: 12, color: "var(--color-text-secondary)" }}>Outfit này không tồn tại hoặc đã bị xóa.</p>
        <Link href="/smart-outfit" className="btn btn-primary" style={{ marginTop: 24, display: "inline-block" }}>
          Quay lại Smart Outfit
        </Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <nav className="breadcrumb" style={{ marginBottom: 24 }} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/smart-outfit">Smart Outfit</Link>
        <span>/</span>
        <span className="breadcrumb-current">{outfit.name}</span>
      </nav>

      <OutfitDetail outfit={outfit} products={products} relatedProducts={related} />
    </div>
  );
}
