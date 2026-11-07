"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CloseIcon, ChevronDownIcon } from "@/components/common/Icons";
import { useUser } from "@/context/UserContext";

const links = [
  { label: "New Arrivals", href: "/category/new-arrivals" },
  { label: "Men", href: "/category/men" },
  { label: "Women", href: "/category/women" },
  { label: "Smart Outfit", href: "/smart-outfit" },
  { label: "AI Stylist", href: "/smart-outfit/ai-stylist" },
  { label: "My Orders", href: "/orders" }
];

export default function MobileMenu({ isOpen, onClose, categories = [] }) {
  const router = useRouter();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const { user, isLoggedIn, logout } = useUser();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column"
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Menu điều hướng"
    >
      <div
        style={{
          height: "var(--header-height-mobile)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid var(--color-border)"
        }}
      >
        <span style={{ fontWeight: 700, letterSpacing: "0.12em" }}>ROUTINE THU ĐÔNG</span>
        <button aria-label="Đóng menu" onClick={onClose} style={{ padding: 8 }}>
          <CloseIcon />
        </button>
      </div>

      <nav style={{ padding: "8px 16px", overflowY: "auto", flex: 1 }} aria-label="Điều hướng di động">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            style={{
              display: "block",
              padding: "16px 4px",
              fontSize: 16,
              borderBottom: "1px solid var(--color-border)"
            }}
          >
            {item.label}
          </Link>
        ))}

        <button
          onClick={() => setCategoryOpen((v) => !v)}
          aria-expanded={categoryOpen}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 4px",
            fontSize: 16,
            borderBottom: "1px solid var(--color-border)"
          }}
        >
          Category
          <ChevronDownIcon style={{ transform: categoryOpen ? "rotate(180deg)" : "none" }} />
        </button>
        {categoryOpen && (
          <div style={{ padding: "4px 4px 12px 16px", display: "flex", flexDirection: "column" }}>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                onClick={onClose}
                style={{ padding: "10px 0", fontSize: 14, color: "var(--color-text-secondary)" }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div style={{ padding: "16px 16px 8px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 12 }}>
        <Link href="/wishlist" onClick={onClose} className="btn btn-secondary btn-full">
          Wishlist
        </Link>
        <Link href="/cart" onClick={onClose} className="btn btn-primary btn-full">
          Giỏ hàng
        </Link>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {isLoggedIn ? (
          <button
            type="button"
            className="btn btn-secondary btn-full btn-sm"
            onClick={() => {
              logout();
              onClose();
              router.push("/login");
            }}
            style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
          >
            Đăng xuất ({user?.name || "Khách hàng"})
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/login" onClick={onClose} className="btn btn-secondary btn-full btn-sm">
              Đăng nhập
            </Link>
            <Link href="/register" onClick={onClose} className="btn btn-primary btn-full btn-sm">
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
