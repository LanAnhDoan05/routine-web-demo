// Cấu hình menu Admin dùng chung cho AdminSidebar (điều hướng) và AdminHeader
// (breadcrumb). `icon` là key ánh xạ sang component icon trong AdminSidebar.
export const NAV_SECTIONS = [
  {
    section: null,
    items: [{ label: "Dashboard", href: "/admin", icon: "dashboard" }],
  },
  {
    section: "CATALOG",
    items: [
      { label: "Products", href: "/admin/products", icon: "products" },
      { label: "Categories", href: "/admin/categories", icon: "categories" },
      { label: "Styles", href: "/admin/styles", icon: "styles" },
      { label: "Outfits", href: "/admin/outfits", icon: "outfits" },
    ],
  },
  {
    section: "ORDERS",
    items: [{ label: "Orders", href: "/admin/orders", icon: "orders" }],
  },
  {
    section: "CUSTOMERS",
    items: [{ label: "Customers", href: "/admin/customers", icon: "customers" }],
  },
  {
    section: "MARKETING",
    items: [{ label: "Vouchers", href: "/admin/vouchers", icon: "vouchers" }],
  },
  {
    section: "CONTENT",
    items: [
      { label: "Banners & Hero", href: "/admin/banners", icon: "hero" },
      { label: "Reviews", href: "/admin/reviews", icon: "reviews" },
    ],
  },
  {
    section: "OPERATIONS",
    items: [{ label: "Stores", href: "/admin/stores", icon: "stores" }],
  },
  {
    section: "SYSTEM",
    items: [{ label: "Settings", href: "/admin/settings", icon: "settings" }],
  },
];

export const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

// Trả về nav item khớp nhất với pathname hiện tại (để active-state + breadcrumb),
// dùng độ dài href để ưu tiên match cụ thể hơn (vd. /admin/products/new vẫn active "Products").
export function findActiveNavItem(pathname) {
  let best = null;
  for (const item of NAV_ITEMS) {
    const isMatch = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
    if (isMatch && (!best || item.href.length > best.href.length)) {
      best = item;
    }
  }
  return best;
}

// Sinh nhãn breadcrumb phụ (vd. "Add Product", "Edit Product") cho các route con.
export function getBreadcrumbTrailingLabel(pathname) {
  if (pathname.startsWith("/admin/products/new")) return "Add Product";
  if (/^\/admin\/products\/[^/]+\/edit/.test(pathname)) return "Edit Product";
  return null;
}
