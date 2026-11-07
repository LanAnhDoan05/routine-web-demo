import { getCategoryBySlug } from "@/lib/categoryService";
import { fetchProductsByCategory } from "@/lib/productService";
import CategoryClient from "@/components/product/CategoryClient";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  const title = category?.name ? `${category.name} — Routine Thu Đông` : `${slug?.toUpperCase()} — Routine Thu Đông`;
  const description =
    category?.description ||
    `Khám phá bộ sưu tập ${category?.name || slug} tại Routine Thu Đông. Thời trang tối giản, chất lượng vượt trội.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategoryBySlug(slug),
    fetchProductsByCategory(slug),
  ]);

  return (
    <CategoryClient
      initialCategory={category || { id: slug, name: slug?.toUpperCase(), slug }}
      initialProducts={products || []}
      slug={slug}
    />
  );
}
