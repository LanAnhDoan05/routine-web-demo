"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/common/Toast";
import { HeartIcon } from "@/components/common/Icons";

export default function WishlistButton({ productId, size = "md", className = "" }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { requireAuth } = useUser();
  const { showToast } = useToast();
  const active = isInWishlist(productId);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    // Yêu cầu đăng nhập trước khi thêm/xóa sản phẩm yêu thích
    if (
      !requireAuth({
        title: "Yêu thích sản phẩm",
        message: "Vui lòng đăng nhập tài khoản Routine để lưu sản phẩm vào danh sách yêu thích của riêng bạn.",
      })
    ) {
      return;
    }

    toggleWishlist(productId);
    showToast(active ? "Đã xóa khỏi danh sách yêu thích" : "Đã thêm vào danh sách yêu thích");
  }

  const dimension = size === "sm" ? 32 : 40;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Xóa khỏi wishlist" : "Thêm vào wishlist"}
      aria-pressed={active}
      className={className}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.9)",
        color: active ? "var(--color-error)" : "var(--color-text)",
        transition: "transform 0.2s ease, color 0.2s ease",
        transform: active ? "scale(1.05)" : "scale(1)",
        cursor: "pointer",
        border: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <HeartIcon filled={active} />
    </button>
  );
}
