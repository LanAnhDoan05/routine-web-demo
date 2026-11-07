import styles from "./AuthLayout.module.css";
import AuthLogo from "./AuthLogo";

/**
 * Layout 2 cột dùng cho mọi màn hình Authentication:
 *  - Desktop (>=1024px): ảnh thời trang bên trái (50%, full height),
 *    form bên phải.
 *  - Mobile/tablet: ẩn ảnh, form full width.
 */
export default function AuthLayout({
  children,
  imageSrc = "/images/hero/auth-hero.jpg",
  imageAlt = "Không gian mua sắm tại cửa hàng Routine Thu Đông",
  caption = "ROUTINE THU ĐÔNG — SMART FASHION & CONTEMPORARY LIFESTYLE",
  contentMaxWidth,
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.imagePanel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.image} src={imageSrc} alt={imageAlt} />
        <div className={styles.imageCaption}>
          <p className={styles.imageCaptionText}>{caption}</p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formPanelLogo}>
          <AuthLogo />
        </div>
        <div className={styles.formPanelInner}>
          <div
            className={styles.formPanelContent}
            style={contentMaxWidth ? { "--content-max-width": contentMaxWidth } : undefined}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
