"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import PlaceholderImage from "@/components/common/PlaceholderImage";
import ProductGrid from "@/components/product/ProductGrid";
import OutfitGrid from "@/components/outfit/OutfitGrid";
import { useUser } from "@/context/UserContext";
import { fetchAllProducts } from "@/lib/productService";
import { fetchApi } from "@/lib/api";
import { getCategories } from "@/lib/categoryService";
import { getCategoryImageFallback } from "@/lib/categoryImages";
import { getStyles } from "@/lib/styleService";
import { styles as defaultStyles } from "@/data/styles";
import HeroSlider from "@/components/home/HeroSlider";
import homeStyles from "./Home.module.css";

const genderFilters = [
  { label: "All", value: null },
  { label: "Men", value: "men" },
  { label: "Women", value: "women" }
];

function getCategoryCardImage(category, products) {
  const categoryImage = category.image || category.imageUrl || getCategoryImageFallback(category);
  if (!categoryImage.startsWith("/images/categories/")) return categoryImage;

  const categoryKeys = new Set(
    [category.id, category.slug].filter(Boolean).map((value) => String(value).toLowerCase())
  );
  const matchesCategory = (product, keys) =>
    [product.categoryId, product.categorySlug, product.category]
      .filter(Boolean)
      .some((value) => keys.has(String(value).toLowerCase()));
  const representativeProduct =
    products.find((product) => matchesCategory(product, categoryKeys)) ||
    (category.parentId
      ? products.find((product) => matchesCategory(product, new Set([String(category.parentId).toLowerCase()])))
      : null);
  const productImages = Array.isArray(representativeProduct?.images)
    ? representativeProduct.images
    : [representativeProduct?.image || representativeProduct?.imageUrl];
  const productImage = productImages.find((image) => typeof image === "string" && image.trim());

  return productImage || categoryImage;
}

export default function HomePage() {
  const { isLoggedIn, user } = useUser();
  const [trendingFilter, setTrendingFilter] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [quickCategories, setQuickCategories] = useState([]);
  const [featuredOutfits, setFeaturedOutfits] = useState([]);
  const [styles, setStyles] = useState([]);
  const [heroConfig, setHeroConfig] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    fetchAllProducts().then((items) => {
      if (items && items.length > 0) {
        setAllProducts(items);
      }
    });
    getCategories().then((cats) => {
      if (Array.isArray(cats)) setQuickCategories(cats);
    });
    fetchApi('/outfits/featured?limit=4').then((ofs) => {
      if (Array.isArray(ofs) && ofs.length > 0) setFeaturedOutfits(ofs);
    }).catch(() => {});
    fetchApi('/settings/hero-banners').then((banners) => {
      if (banners) setHeroConfig(banners);
    }).catch(() => {});
    getStyles().then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        setStyles(items.filter((s) => s.status !== "INACTIVE"));
      }
    }).catch(() => {});
  }, []);

  const heroBanners = useMemo(() => {
    if (Array.isArray(heroConfig?.banners) && heroConfig.banners.length > 0) {
      return heroConfig.banners;
    }
    if (Array.isArray(heroConfig?.rightImages) && heroConfig.rightImages.length > 0) {
      return heroConfig.rightImages;
    }
    return [
      { id: 'hb-1', url: '/images/hero/hero-banner-1.svg', title: 'STYLE THAT FITS YOU 1' },
      { id: 'hb-2', url: '/images/hero/hero-banner-2.svg', title: 'STYLE THAT FITS YOU 2' },
      { id: 'hb-3', url: '/images/hero/hero-banner-3.svg', title: 'STYLE THAT FITS YOU 3' },
    ];
  }, [heroConfig]);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = heroConfig?.slideInterval || 2500;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, interval);
    return () => clearInterval(timer);
  }, [heroBanners.length, heroConfig?.slideInterval]);

  const featuredProducts = useMemo(() => {
    return allProducts.filter((product) => product.isFeatured || product.badge === "BEST SELLER").slice(0, 8);
  }, [allProducts]);

  const categorySections = useMemo(() => {
    const active = Array.from(
      new Map(
        quickCategories
          .filter((category) => category.status !== "INACTIVE")
          .map((category) => [category.slug || category.id, category])
      ).values()
    );
    const audienceSlugs = new Set(["men", "women", "unisex"]);
    const collectionSlugs = new Set(["new-arrivals"]);
    return [
      { title: "Bộ sưu tập", categories: active.filter((category) => collectionSlugs.has(category.slug)) },
      { title: "Danh mục giới tính", categories: active.filter((category) => audienceSlugs.has(category.slug)) },
      {
        title: "Loại sản phẩm",
        categories: active.filter((category) => !category.parentId && !audienceSlugs.has(category.slug) && !collectionSlugs.has(category.slug)),
      },
      { title: "Danh mục con", categories: active.filter((category) => category.parentId) },
    ].filter((section) => section.categories.length > 0);
  }, [quickCategories]);

  const newArrivals = useMemo(
    () => allProducts.filter((product) => product.badge === "NEW").slice(0, 8),
    [allProducts]
  );

  const trendingAll = useMemo(() => {
    return allProducts.slice(0, 12);
  }, [allProducts]);

  const trendingProducts = useMemo(() => {
    if (!trendingFilter) return trendingAll;
    return trendingAll.filter((p) => p.gender === trendingFilter);
  }, [trendingFilter, trendingAll]);

  const recommended = useMemo(() => {
    if (!isLoggedIn) return [];
    const pref = (user?.stylePreference || "minimal").toLowerCase();
    return allProducts.filter((p) => {
      const styles = Array.isArray(p.styles) ? p.styles : (Array.isArray(p.style) ? p.style : [p.style].filter(Boolean));
      return styles.some((s) => String(s).toLowerCase().includes(pref));
    }).slice(0, 4);
  }, [isLoggedIn, user, allProducts]);

  return (
    <div>
      {/* HERO BANNER (GỘP TOÀN BỘ STYLE THAT FITS YOU VÀ SHOWCASE THÀNH 1 BANNER CHUYỂN ĐỘNG) */}
      <section className={homeStyles.hero}>
        {/* Full-width background / visual slides */}
        <div className={homeStyles.heroSlider}>
          {heroBanners.map((img, i) => {
            const src = typeof img === 'string' ? img : img.url;
            const isActive = i === heroIndex;
            return (
              <div
                key={img.id || src || i}
                className={`${homeStyles.heroSlide} ${isActive ? homeStyles.heroSlideActive : ''}`}
                aria-hidden={!isActive}
              >
                <img
                  src={src}
                  alt={img.title || "Routine Hero Banner"}
                  className={homeStyles.heroSlideImg}
                  onError={(e) => {
                    e.currentTarget.src = "/images/hero/hero-banner-1.svg";
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Soft overlay gradient ensuring text readability on left side */}
        <div className={homeStyles.heroOverlay} />

        {/* Hero Content (STYLE THAT FITS YOU) */}
        <div className={homeStyles.heroContent}>
          <span className={homeStyles.heroEyebrow}>ROUTINE THU ĐÔNG — SMART FASHION</span>
          <h1 className={homeStyles.heroTitle}>
            {heroConfig?.title || "STYLE THAT FITS YOU"}
          </h1>
          <p className={homeStyles.heroText} style={{ whiteSpace: "pre-line" }}>
            {heroConfig?.subtitle ||
              "Khám phá phong cách phù hợp với bạn.\nThời trang không chỉ là mặc gì. Đó là cách bạn thể hiện chính mình."}
          </p>
          <div className={homeStyles.heroActions}>
            <Link href={heroConfig?.exploreLink || "/category/new-arrivals"} className="btn btn-primary">
              Khám phá sản phẩm
            </Link>
            <Link href={heroConfig?.outfitLink || "/smart-outfit"} className="btn btn-secondary">
              Tạo outfit
            </Link>
          </div>
        </div>

        {/* Slider Navigation Dots */}
        {heroBanners.length > 1 ? (
          <div className={homeStyles.heroDots} role="tablist" aria-label="Hero banner pagination">
            {heroBanners.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${homeStyles.heroDot} ${i === heroIndex ? homeStyles.heroDotActive : ''}`}
                onClick={() => setHeroIndex(i)}
                aria-label={`Chuyển tới banner ${i + 1}`}
                role="tab"
              />
            ))}
          </div>
        ) : null}
      </section>

      {/* QUICK CATEGORY */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Shop by</span>
            <h2 className="section-title">Category</h2>
          </div>
          {categorySections.map((section) => (
            <div className={homeStyles.categoryGroup} key={section.title}>
              <h3 className={homeStyles.categoryGroupTitle}>{section.title}</h3>
              <div className={homeStyles.categoryGrid}>
                {section.categories.map((cat) => {
                  const imgSrc = getCategoryCardImage(cat, allProducts);
                  return (
                    <Link key={cat.slug || cat.id} href={`/category/${cat.slug}`} className={homeStyles.categoryCard}>
                      <div className={homeStyles.categoryThumbWrap}>
                        <img
                          src={imgSrc}
                          alt={cat.name}
                          className={homeStyles.categoryThumb}
                          onError={(e) => {
                            if (e.currentTarget.dataset.fallbackAttempted) {
                              e.currentTarget.style.visibility = "hidden";
                              return;
                            }
                            e.currentTarget.dataset.fallbackAttempted = "true";
                            e.currentTarget.src = getCategoryImageFallback(cat);
                          }}
                        />
                      </div>
                      <p className={homeStyles.categoryName}>{cat.name}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section" style={{ background: "var(--color-bg-secondary)" }}>
        <div className="container">
          <div className="section-header section-header--row">
            <div>
              <span className="eyebrow">Curated for you</span>
              <h2 className="section-title">Featured Collection</h2>
              <p className="section-subtitle">Những sản phẩm được yêu thích trong tuần.</p>
            </div>
            <Link href="/category/new-arrivals" className="text-link">
              Xem tất cả →
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="section">
        <div className="container">
          <div className="section-header section-header--row">
            <div>
              <span className="eyebrow">Vừa lên kệ</span>
              <h2 className="section-title">New Arrivals</h2>
            </div>
            <Link href="/category/new-arrivals" className="text-link">
              Xem tất cả →
            </Link>
          </div>
          <ProductGrid products={newArrivals} emptyTitle="Chưa có sản phẩm mới" />
        </div>
      </section>

      {/* SMART OUTFIT SECTION */}
      <section className="section">
        <div className="container">
          <div className="section-header section-header--row">
            <div>
              <span className="eyebrow">Smart Fashion</span>
              <h2 className="section-title">SMART OUTFIT</h2>
              <p className="section-subtitle">
                Không chỉ mua từng món đồ. Hãy khám phá cách phối chúng thành một outfit hoàn chỉnh.
              </p>
            </div>
            <Link href="/smart-outfit" className="text-link">
              Khám phá Smart Outfit →
            </Link>
          </div>
          <OutfitGrid outfits={featuredOutfits} />
        </div>
      </section>

      {/* AI STYLIST SECTION */}
      <section className="section" style={{ background: "var(--color-primary)", color: "#fff" }}>
        <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24 }}>
          <span className="eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>
            AI Powered
          </span>
          <h2 className="section-title" style={{ maxWidth: 560 }}>
            MEET YOUR AI STYLIST
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", maxWidth: 520, lineHeight: 1.7 }}>
            Bạn không biết hôm nay nên mặc gì? Hãy để AI Stylist gợi ý outfit dựa trên phong cách, dịp sử dụng và
            những món đồ bạn yêu thích.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
              color: "rgba(255,255,255,0.85)",
              fontSize: 13
            }}
          >
            <span className="badge badge-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              User preference
            </span>
            <span>→</span>
            <span className="badge badge-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              AI Stylist
            </span>
            <span>→</span>
            <span className="badge badge-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              Recommended Outfit
            </span>
            <span>→</span>
            <span className="badge badge-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              Products
            </span>
          </div>

          <Link href="/smart-outfit/ai-stylist" className="btn btn-primary" style={{ background: "#fff", color: "var(--color-primary)" }}>
            Ask AI Stylist
          </Link>
        </div>
      </section>

      {/* TRENDING PRODUCTS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Hot right now</span>
            <h2 className="section-title">Trending Now</h2>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {genderFilters.map((f) => (
              <button
                key={f.label}
                className={`chip ${trendingFilter === f.value ? "is-active" : ""}`}
                onClick={() => setTrendingFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <ProductGrid products={trendingProducts} emptyTitle="Chưa có sản phẩm phù hợp" />
        </div>
      </section>

      {/* STYLE INSPIRATION */}
      <section className="section" style={{ background: "var(--color-bg-secondary)" }} id="style-inspiration">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Find your look</span>
            <h2 className="section-title">STYLE INSPIRATION</h2>
            <p className="section-subtitle">Khám phá phong cách thời trang định hình cá tính của bạn</p>
          </div>
          <div className={homeStyles.styleGrid}>
            {(styles.length > 0 ? styles : defaultStyles).map((style) => {
              const rawSrc = style.imageUrl || style.image;
              const imgSrc = (rawSrc && !rawSrc.endsWith('.svg'))
                ? rawSrc
                : `/images/styles/${style.slug}.jpg`;
              return (
                <Link key={style.slug} href={`/category/style/${style.slug}`} className={homeStyles.styleCard}>
                  <div className={homeStyles.styleImgWrap}>
                    <img
                      src={imgSrc}
                      alt={style.name}
                      className={homeStyles.styleImg}
                      onError={(e) => {
                        if (!e.currentTarget.src.includes('/images/styles/basic.jpg')) {
                          e.currentTarget.src = '/images/styles/basic.jpg';
                        }
                      }}
                    />
                  </div>
                  <div className={homeStyles.styleInfo}>
                    <h3 className={homeStyles.styleName}>{style.name}</h3>
                    {style.description ? (
                      <p className={homeStyles.styleDesc}>{style.description}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* PERSONALIZED RECOMMENDATION */}
      <section className="section">
        <div className="container">
          {isLoggedIn ? (
            <>
              <div className="section-header">
                <span className="eyebrow">Just for you</span>
                <h2 className="section-title">Recommended For You</h2>
                <p className="section-subtitle">Dựa trên phong cách bạn đã chọn</p>
              </div>
              <ProductGrid products={recommended} />
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                background: "var(--color-bg-secondary)",
                borderRadius: "var(--radius-md)",
                padding: "64px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16
              }}
            >
              <h2 className="section-title">FIND YOUR STYLE</h2>
              <p className="section-subtitle">Khám phá phong cách phù hợp với bạn.</p>
              <Link href="/smart-outfit" className="btn btn-primary">
                Khám phá phong cách
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section">
        <div
          className="container"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16
          }}
        >
          <h2 className="section-title">Đăng ký nhận tin</h2>
          <p className="section-subtitle">Cập nhật bộ sưu tập mới và ưu đãi dành riêng cho bạn.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: "flex", gap: 10, width: "100%", maxWidth: 420 }}
          >
            <input type="email" required placeholder="Email của bạn" className="input" style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary">
              Đăng ký
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
