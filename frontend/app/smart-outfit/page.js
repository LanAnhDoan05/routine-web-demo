"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import PlaceholderImage from "@/components/common/PlaceholderImage";
import OutfitGrid from "@/components/outfit/OutfitGrid";
import { getOutfits, getFeaturedOutfits } from "@/lib/outfitService";
import { getStyles } from "@/lib/styleService";
import { useUser } from "@/context/UserContext";

const occasions = [
  { slug: "everyday", label: "Everyday" },
  { slug: "office", label: "Office" },
  { slug: "date", label: "Date" },
  { slug: "weekend", label: "Weekend" },
  { slug: "travel", label: "Travel" },
  { slug: "party", label: "Party" }
];

export default function SmartOutfitPage() {
  const { user } = useUser();
  const [activeGender, setActiveGender] = useState(null);
  const [activeStyle, setActiveStyle] = useState(null);
  const [activeOccasion, setActiveOccasion] = useState(null);
  const [outfitsList, setOutfitsList] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [styleList, setStyleList] = useState([]);

  useEffect(() => {
    if (user?.gender && (user.gender === "men" || user.gender === "women")) {
      setActiveGender(user.gender);
    }
  }, [user]);

  useEffect(() => {
    getOutfits().then((items) => {
      if (Array.isArray(items)) setOutfitsList(items);
    });
    getFeaturedOutfits(4).then((items) => {
      if (Array.isArray(items)) setFeatured(items);
    });
    getStyles().then((styles) => {
      if (Array.isArray(styles)) setStyleList(styles);
    });
  }, []);

  const genderFilteredOutfits = useMemo(() => {
    if (!activeGender || activeGender === "all") return outfitsList;
    return outfitsList.filter((o) => {
      const g = (o.gender || "unisex").toLowerCase();
      return g === activeGender || g === "unisex";
    });
  }, [activeGender, outfitsList]);

  const filteredFeatured = useMemo(() => {
    if (!activeGender || activeGender === "all") return featured;
    const list = featured.filter((o) => {
      const g = (o.gender || "unisex").toLowerCase();
      return g === activeGender || g === "unisex";
    });
    return list.length > 0 ? list : featured;
  }, [activeGender, featured]);

  const filteredByStyle = useMemo(
    () => (activeStyle ? genderFilteredOutfits.filter((o) => o.style === activeStyle || o.styleId === activeStyle) : genderFilteredOutfits),
    [activeStyle, genderFilteredOutfits]
  );

  const filteredByOccasion = useMemo(
    () => (activeOccasion ? genderFilteredOutfits.filter((o) => o.occasion === activeOccasion) : genderFilteredOutfits),
    [activeOccasion, genderFilteredOutfits]
  );

  return (
    <div>
      {/* HERO */}
      <section className="section" style={{ background: "var(--color-bg-secondary)" }}>
        <div className="container" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <span className="eyebrow">Smart Fashion</span>
          <h1 className="section-title" style={{ fontSize: 40 }}>
            SMART OUTFIT
          </h1>
          <p className="section-subtitle" style={{ maxWidth: 520 }}>
            Phối đồ dễ hơn. Mặc đẹp hơn. Khám phá những outfit được tạo từ các sản phẩm trong hệ thống.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="#featured-outfits" className="btn btn-primary">
              Khám phá outfit
            </a>
            <Link href="/smart-outfit/ai-stylist" className="btn btn-secondary">
              AI Stylist
            </Link>
          </div>
        </div>
      </section>

      {/* GENDER PREFERENCE BAR */}
      <section style={{ borderBottom: "1px solid var(--color-border)", background: "#ffffff", padding: "16px 0" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Gợi ý theo đối tượng:
            </span>
            {user?.gender && (
              <span style={{ fontSize: 12, background: "var(--color-bg-secondary)", padding: "2px 8px", borderRadius: 4, color: "var(--color-text)" }}>
                (Ưu tiên theo tài khoản của bạn)
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`chip ${!activeGender ? "is-active" : ""}`}
              onClick={() => setActiveGender(null)}
            >
              Tất cả outfit
            </button>
            <button
              type="button"
              className={`chip ${activeGender === "men" ? "is-active" : ""}`}
              onClick={() => setActiveGender("men")}
            >
              ♂ Trang phục Nam
            </button>
            <button
              type="button"
              className={`chip ${activeGender === "women" ? "is-active" : ""}`}
              onClick={() => setActiveGender("women")}
            >
              ♀ Trang phục Nữ
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED OUTFITS */}
      <section className="section" id="featured-outfits">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Handpicked</span>
            <h2 className="section-title">Featured Outfits</h2>
          </div>
          <OutfitGrid outfits={filteredFeatured} />
        </div>
      </section>

      {/* BROWSE BY STYLE */}
      <section className="section" style={{ background: "var(--color-bg-secondary)" }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Explore</span>
            <h2 className="section-title">Browse By Style</h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            <button className={`chip ${!activeStyle ? "is-active" : ""}`} onClick={() => setActiveStyle(null)}>
              All
            </button>
            {styleList.map((s) => (
              <button
                key={s.slug}
                className={`chip ${activeStyle === s.slug ? "is-active" : ""}`}
                onClick={() => setActiveStyle(s.slug)}
              >
                {s.name}
              </button>
            ))}
          </div>
          <OutfitGrid outfits={filteredByStyle} />
        </div>
      </section>

      {/* BROWSE BY OCCASION */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Explore</span>
            <h2 className="section-title">Browse By Occasion</h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            <button className={`chip ${!activeOccasion ? "is-active" : ""}`} onClick={() => setActiveOccasion(null)}>
              All
            </button>
            {occasions.map((o) => (
              <button
                key={o.slug}
                className={`chip ${activeOccasion === o.slug ? "is-active" : ""}`}
                onClick={() => setActiveOccasion(o.slug)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <OutfitGrid outfits={filteredByOccasion} />
        </div>
      </section>

      {/* CREATE YOUR OUTFIT */}
      <section className="section" style={{ background: "var(--color-bg-secondary)" }}>
        <div className="container create-outfit-grid">
          <PlaceholderImage label="Create Your Outfit" ratio="4 / 3" rounded />
          <div>
            <span className="eyebrow">Your style, your rules</span>
            <h2 className="section-title" style={{ marginBottom: 12 }}>
              Create Your Outfit
            </h2>
            <p className="section-subtitle" style={{ marginBottom: 20 }}>
              Chọn từng món đồ yêu thích và tự tạo outfit của riêng bạn, hoặc để AI Stylist gợi ý giúp bạn.
            </p>
            <Link href="/category/new-arrivals" className="btn btn-primary">
              Bắt đầu phối đồ
            </Link>
          </div>
        </div>
      </section>

      {/* AI STYLIST CTA */}
      <section className="section">
        <div className="container" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <span className="eyebrow">AI Powered</span>
          <h2 className="section-title">AI Stylist</h2>
          <p className="section-subtitle" style={{ maxWidth: 480 }}>
            Không biết bắt đầu từ đâu? Trả lời vài câu hỏi để nhận gợi ý outfit phù hợp với bạn.
          </p>
          <Link href="/smart-outfit/ai-stylist" className="btn btn-primary">
            Ask AI Stylist
          </Link>
        </div>
      </section>

      <style>{`
        .create-outfit-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }
        @media (max-width: 767px) {
          .create-outfit-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
