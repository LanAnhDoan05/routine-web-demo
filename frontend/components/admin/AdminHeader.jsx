"use client";

import { usePathname, useRouter } from "next/navigation";
import { findActiveNavItem, getBreadcrumbTrailingLabel } from "@/lib/adminNav";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/admin/ToastProvider";
import { IconMenu, IconSearch, IconBell, IconLogout } from "./icons";
import styles from "./AdminHeader.module.css";

export default function AdminHeader({ onMenuClick }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUser();
  const { showToast } = useToast();
  const active = findActiveNavItem(pathname);
  const trailing = getBreadcrumbTrailingLabel(pathname);
  const primaryLabel = active?.label || "Dashboard";

  function handleLogout() {
    logout();
    showToast("Đã đăng xuất khỏi trang quản trị.");
    router.push("/login");
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button type="button" className={styles.menuBtn} aria-label="Mở menu" onClick={onMenuClick}>
          <IconMenu size={20} />
        </button>
        <span className={styles.mobileBrand}>ROUTINE THU ĐÔNG</span>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span className={styles.crumbCurrent}>{primaryLabel}</span>
          {trailing ? (
            <>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbCurrent}>{trailing}</span>
            </>
          ) : null}
        </nav>
      </div>

      <div className={styles.right}>
        <label className={styles.search}>
          <IconSearch size={16} />
          <input type="search" placeholder="Search..." aria-label="Tìm kiếm" />
        </label>

        <button type="button" className={styles.iconBtn} aria-label="Thông báo">
          <IconBell size={18} />
          <span className={styles.dot} aria-hidden="true" />
        </button>

        <div className={styles.profile}>
          <img src="/images/avatars/admin.svg" alt="" className={styles.avatar} />
          <span className={styles.profileName}>{user?.name || "Admin"}</span>
        </div>

        <button
          type="button"
          className={styles.logoutBtn}
          aria-label="Đăng xuất khỏi trang quản trị"
          title="Đăng xuất"
          onClick={handleLogout}
        >
          <IconLogout size={17} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
