import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { RegistrationProvider } from "@/context/RegistrationContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import { CheckoutProvider } from "@/context/CheckoutContext";
import { OrderProvider } from "@/context/OrderContext";
import { ProductCardSettingsProvider } from "@/context/ProductCardSettingsContext";
import { ToastProvider } from "@/components/common/Toast";
import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "Routine Thu Đông — Smart Fashion",
  description:
    "Routine Thu Đông — nền tảng thời trang tối giản giúp bạn khám phá sản phẩm, xây dựng outfit và nhận gợi ý phong cách cá nhân."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <UserProvider>
          <RegistrationProvider>
            <WishlistProvider>
              <CartProvider>
                <OrderProvider>
                  <CheckoutProvider>
                    <ToastProvider>
                      <ProductCardSettingsProvider>
                        <AppShell>{children}</AppShell>
                      </ProductCardSettingsProvider>
                    </ToastProvider>
                  </CheckoutProvider>
                </OrderProvider>
              </CartProvider>
            </WishlistProvider>
          </RegistrationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
