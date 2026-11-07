"use client";

import { useEffect, useState } from "react";
import ProductGrid from "@/components/product/ProductGrid";
import EmptyState from "@/components/common/EmptyState";
import Button from "@/components/common/Button";
import { useWishlist } from "@/context/WishlistContext";
import { useUser } from "@/context/UserContext";
import { fetchProductsByIds } from "@/lib/productService";
import Link from "next/link";

export default function WishlistPage() {
  const { isLoggedIn } = useUser();
  const { productIds, items: contextItems, loading: wishlistLoading } = useWishlist();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!isLoggedIn) {
      setWishlistProducts([]);
      setLoading(false);
      return;
    }

    if (!productIds || productIds.length === 0) {
      setWishlistProducts([]);
      setLoading(false);
      return;
    }

    // Nếu trong context đã có danh sách items đầy đủ và khớp với productIds
    if (Array.isArray(contextItems) && contextItems.length === productIds.length) {
      setWishlistProducts(contextItems);
      setLoading(false);
      return;
    }

    // Nếu chưa có chi tiết, gọi nạp chi tiết sản phẩm theo productIds
    setLoading(true);
    fetchProductsByIds(productIds)
      .then((items) => {
        if (isMounted) {
          setWishlistProducts(items || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productIds, contextItems, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="container section">
        <EmptyState
          title="YOUR WISHLIST"
          description="Đăng nhập để lưu lại những sản phẩm bạn yêu thích."
          action={
            <Link href="/login">
              <Button variant="primary">Đăng nhập</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="section-header">
        <h1 className="section-title">Wishlist</h1>
        <p className="section-subtitle">{wishlistProducts.length} sản phẩm</p>
      </div>

      {loading || wishlistLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)" }}>
          Đang tải danh sách yêu thích…
        </div>
      ) : wishlistProducts.length === 0 ? (
        <EmptyState
          title="Wishlist của bạn đang trống"
          description="Hãy khám phá sản phẩm và lưu lại những món bạn thích vào danh sách yêu thích của riêng bạn."
          action={
            <Button href="/category/new-arrivals" variant="primary">
              Khám phá sản phẩm
            </Button>
          }
        />
      ) : (
        <ProductGrid products={wishlistProducts} />
      )}
    </div>
  );
}
