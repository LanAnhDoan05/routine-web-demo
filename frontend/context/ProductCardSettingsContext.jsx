"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

export const DEFAULT_PRODUCT_CARD_CONFIG = {
  cardStyle: "standard",
  showOriginalPrice: true,
  showSalePrice: true,
  showSaleBadge: true,
  showNewBadge: true,
  showColorSwatches: true,
  showQuickAdd: true,
  showWishlist: true,
  imageAspectRatio: "3 / 4",
  columnsDesktop: 4,
  columnsTablet: 3,
  columnsMobile: 2,
  gapDesktop: 24,
  gapMobile: 16,
};

const ProductCardSettingsContext = createContext(DEFAULT_PRODUCT_CARD_CONFIG);

export function useProductCardSettings() {
  return useContext(ProductCardSettingsContext);
}

export function ProductCardSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_PRODUCT_CARD_CONFIG);

  useEffect(() => {
    let active = true;
    const loadSettings = () => {
      fetchApi("/settings/product-card")
        .then((config) => {
          if (active && config && typeof config === "object") {
            setSettings({ ...DEFAULT_PRODUCT_CARD_CONFIG, ...config });
          }
        })
        .catch(() => {});
    };
    const handleSettingsUpdate = (event) => {
      if (event.detail && typeof event.detail === "object") {
        setSettings({ ...DEFAULT_PRODUCT_CARD_CONFIG, ...event.detail });
      }
    };

    loadSettings();
    window.addEventListener("focus", loadSettings);
    window.addEventListener("routine:product-card-config", handleSettingsUpdate);
    return () => {
      active = false;
      window.removeEventListener("focus", loadSettings);
      window.removeEventListener("routine:product-card-config", handleSettingsUpdate);
    };
  }, []);

  return (
    <ProductCardSettingsContext.Provider value={settings}>
      {children}
    </ProductCardSettingsContext.Provider>
  );
}