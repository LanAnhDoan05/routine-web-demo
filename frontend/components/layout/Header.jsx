"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";
import { fetchApi } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/common/Toast";
import { SearchIcon, HeartIcon, BagIcon, UserIcon, MenuIcon, CloseIcon } from "@/components/common/Icons";
import styles from "./Header.module.css";

const primaryNav = [
  { label: "NEW", href: "/category/new-arrivals" },
  { label: "MEN", href: "/category/men" },
  { label: "WOMEN", href: "/category/women" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaMenuCats, setMegaMenuCats] = useState([]);

  useEffect(() => {
    fetchApi('/categories?type=mega')
      .then((data) => {
        if (Array.isArray(data)) setMegaMenuCats(data);
        else if (data?.megaMenuCategories) setMegaMenuCats(data.megaMenuCategories);
      })
      .catch(() => {});
  }, []);

  const router = useRouter();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, isLoggedIn, logout } = useUser();
  const { showToast } = useToast();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [router]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = () => setUserMenuOpen(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [userMenuOpen]);

  function handleSearchSubmit(query) {
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  }

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
    showToast("Đã đăng xuất thành công.");
    router.push("/login");
  }

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
      <div className={`container ${styles.headerInner}`}>
        <div className={styles.bar}>
          <div className={styles.left}>
            <button
              className={`${styles.iconBtn} ${styles.menuBtn}`}
              aria-label="Mở menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon />
            </button>
            <Logo className={styles.desktopLogo} />
            <nav className={styles.nav} aria-label="Điều hướng chính">
              {primaryNav.map((item) => (
                <Link key={item.href} href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              ))}
              <div className={styles.navGroup}>
                <button className={styles.navLink} aria-haspopup="true">
                  CATEGORY
                </button>
                <div className={styles.megaMenu} role="menu">
                  {megaMenuCats.map((cat) => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.megaMenuItem} role="menuitem">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/smart-outfit" className={styles.navLink}>
                SMART OUTFIT
              </Link>
            </nav>
          </div>

          <div className={styles.mobileLogoWrap}>
            <Logo />
          </div>

          <div className={styles.actions}>
            <button
              className={styles.iconBtn}
              aria-label={searchOpen ? "Đóng tìm kiếm" : "Tìm kiếm"}
              onClick={() => setSearchOpen((v) => !v)}
            >
              {searchOpen ? <CloseIcon /> : <SearchIcon />}
            </button>

            <Link href="/wishlist" className={styles.iconBtn} aria-label={`Wishlist, ${wishlistCount} sản phẩm`}>
              <HeartIcon />
              {wishlistCount > 0 && <span className={styles.count}>{wishlistCount}</span>}
            </Link>

            <Link href="/cart" className={styles.iconBtn} aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}>
              <BagIcon />
              {itemCount > 0 && <span className={styles.count}>{itemCount}</span>}
            </Link>

            {/* Menu User: Đăng nhập / Đơn hàng / Đăng xuất */}
            <div className={styles.userMenuWrap} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.iconBtn}
                aria-label={isLoggedIn ? `Tài khoản: ${user?.name || ""}` : "Tài khoản người dùng"}
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <UserIcon />
                {isLoggedIn && <span className={styles.userBadge} />}
              </button>

              {userMenuOpen && (
                <div className={styles.userDropdown} role="menu">
                  {isLoggedIn ? (
                    <>
                      <div className={styles.userDropdownHeader}>
                        <p className={styles.userDropdownName}>{user?.name || "Khách hàng"}</p>
                        <p className={styles.userDropdownSub}>{user?.role === "ADMIN" ? "Quản trị viên (Admin)" : "Đã đăng nhập"}</p>
                      </div>
                      {user?.role === "ADMIN" && (
                        <Link
                          href="/admin/products"
                          className={styles.userDropdownItem}
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          style={{ color: "#d9534f", fontWeight: "600" }}
                        >
                          ⚙️ Quản trị hệ thống (Admin)
                        </Link>
                      )}
                      <Link
                        href="/orders"
                        className={styles.userDropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                      >
                        📦 Đơn hàng của tôi
                      </Link>
                      <button
                        type="button"
                        className={`${styles.userDropdownItem} ${styles.userDropdownLogout}`}
                        onClick={handleLogout}
                        role="menuitem"
                      >
                        🚪 Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.userDropdownHeader}>
                        <p className={styles.userDropdownName}>Tài khoản</p>
                        <p className={styles.userDropdownSub}>Chưa đăng nhập</p>
                      </div>
                      <Link
                        href="/login"
                        className={styles.userDropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                      >
                        🔑 Đăng nhập
                      </Link>
                      <Link
                        href="/register"
                        className={styles.userDropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                      >
                        ✨ Đăng ký tài khoản
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className={styles.searchDropdown}>
          <div className="container">
            <SearchBar autoFocus onSearch={handleSearchSubmit} />
          </div>
        </div>
      )}

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} categories={megaMenuCats} />
    </header>
  );
}
