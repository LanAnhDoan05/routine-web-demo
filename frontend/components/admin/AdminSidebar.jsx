"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, findActiveNavItem } from "@/lib/adminNav";
import {
  IconDashboard,
  IconProducts,
  IconCategories,
  IconStyles,
  IconOutfits,
  IconOrders,
  IconCustomers,
  IconVouchers,
  IconReviews,
  IconSettings,
  IconStores,
  IconHero,
  IconX,
} from "./icons";
import styles from "./AdminSidebar.module.css";

const ICONS = {
  dashboard: IconDashboard,
  products: IconProducts,
  categories: IconCategories,
  styles: IconStyles,
  outfits: IconOutfits,
  orders: IconOrders,
  customers: IconCustomers,
  vouchers: IconVouchers,
  reviews: IconReviews,
  hero: IconHero,
  stores: IconStores,
  settings: IconSettings,
};

export default function AdminSidebar({ mobileOpen, onClose }) {
  const pathname = usePathname();
  const active = findActiveNavItem(pathname);

  const content = (
    <>
      <div className={styles.brand}>
        <Link href="/admin" className={styles.brandLink} onClick={onClose}>
          <span className={styles.brandName}>ROUTINE THU ĐÔNG</span>
          <span className={styles.brandSub}>ADMIN PANEL</span>
        </Link>
        <button type="button" className={styles.mobileClose} aria-label="Đóng menu" onClick={onClose}>
          <IconX size={18} />
        </button>
      </div>

      <nav className={styles.nav} aria-label="Điều hướng quản trị">
        {NAV_SECTIONS.map((group, i) => (
          <div className={styles.group} key={group.section || `top-${i}`}>
            {group.section ? <p className={styles.groupLabel}>{group.section}</p> : null}
            <ul>
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const isActive = active?.href === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                      aria-current={isActive ? "page" : undefined}
                      onClick={onClose}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <aside className={styles.sidebar}>{content}</aside>

      {mobileOpen ? (
        <div className={styles.mobileOverlay} role="presentation" onClick={onClose}>
          <aside
            className={styles.mobileSidebar}
            role="dialog"
            aria-modal="true"
            aria-label="Menu quản trị"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
