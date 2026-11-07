import { fetchProductById, fetchRelatedProducts } from "@/lib/productService";
import ProductDetailClient from "@/components/product/ProductDetailClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetchProductById(id);
  if (!product) {
    return {
      title: "Sản phẩm không tìm thấy — Routine Thu Đông",
      description: "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh trên Routine Thu Đông.",
    };
  }

  const rawImages = product.images;
  let mainImage = "";
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    mainImage = rawImages[0];
  } else if (typeof rawImages === "string" && rawImages.trim()) {
    try {
      const parsed = JSON.parse(rawImages);
      mainImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : rawImages;
    } catch {
      mainImage = rawImages;
    }
  } else if (product.image) {
    mainImage = product.image;
  }

  const description =
    product.description ||
    `Mua ngay ${product.name} chính hãng Routine Thu Đông với mức giá ${Number(product.price || 0).toLocaleString("vi-VN")}đ. Thiết kế tối giản, chất liệu cao cấp.`;

  return {
    title: `${product.name} — Routine Thu Đông`,
    description,
    openGraph: {
      title: `${product.name} | Routine Thu Đông`,
      description,
      images: mainImage ? [{ url: mainImage, alt: product.name }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Routine Thu Đông`,
      description,
      images: mainImage ? [mainImage] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = await fetchProductById(id);
  let related = [];
  if (product && product.id) {
    related = await fetchRelatedProducts(product.id, 4);
  }

  // Schema.org JSON-LD cho Google Shopping & Rich Snippets
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || ""],
        description: product.description || product.name,
        sku: product.id,
        offers: {
          "@type": "Offer",
          priceCurrency: "VND",
          price: product.price,
          availability:
            product.stockQuantity && product.stockQuantity > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url: `https://routine.vn/product/${product.id}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient
        initialProduct={product}
        initialRelated={related}
        productId={id}
      />
    </>
  );
}
