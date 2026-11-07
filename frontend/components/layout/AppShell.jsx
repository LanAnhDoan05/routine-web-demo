"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import AIStylistFloatingWidget from "@/components/ai/AIStylistFloatingWidget";

const AUTH_PREFIXES = [
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

export default function AppShell({ children }) {
  const pathname = usePathname();

  // Kiểm tra nếu là trang Auth hoặc Admin thì ẩn Header và Footer của shop
  const isExcludedPage =
    AUTH_PREFIXES.some((prefix) => pathname?.startsWith(prefix)) ||
    pathname?.startsWith("/admin");

  if (isExcludedPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <AIStylistFloatingWidget />
    </>
  );
}
