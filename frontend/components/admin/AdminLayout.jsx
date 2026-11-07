"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useUser } from "@/context/UserContext";
import { fetchApi } from "@/lib/api";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, logout } = useUser();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (!hydrated) return;

    const token = window.localStorage.getItem("routine_token") || window.localStorage.getItem("token");
    let tokenValid = false;
    try {
      const payload = token ? JSON.parse(window.atob(token.split(".")[1])) : null;
      tokenValid = Boolean(payload && (!payload.exp || payload.exp * 1000 > Date.now()));
    } catch {
      tokenValid = false;
    }

    if (!user || user.role !== "ADMIN" || !tokenValid) {
      setCheckingAccess(false);
      logout();
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }

    let cancelled = false;
    fetchApi("/auth/me")
      .then((data) => {
        if (!cancelled && data?.user?.role === "ADMIN") setCheckingAccess(false);
        else if (!cancelled) throw new Error("Admin access denied");
      })
      .catch(() => {
        if (cancelled) return;
        setCheckingAccess(false);
        logout();
        router.replace(`/login?redirect=${encodeURIComponent(pathname || "/admin")}`);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, user, pathname, router, logout]);

  // Đóng drawer mỗi khi chuyển route.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!hydrated || checkingAccess || !user || user.role !== "ADMIN") return null;

  return (
    <div className={styles.shell}>
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={styles.contentColumn}>
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
