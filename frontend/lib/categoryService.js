import { slugify } from "@/data/products";
import { fetchApi } from "./api";
import { getCategoryImageFallback } from "./categoryImages";

function normalizeCategory(c) {
  if (!c) return null;
  const id = String(c.id || c.slug || "").trim();
  return {
    ...c,
    id,
    name: c.name || id,
    slug: c.slug || id,
    parentId: c.parentId || null,
    status: c.status || "ACTIVE",
    imageUrl: c.imageUrl || c.image || getCategoryImageFallback(c),
  };
}

export async function getCategories() {
  try {
    const data = await fetchApi('/categories');
    if (data) {
      if (Array.isArray(data)) {
        return data.map(normalizeCategory).filter(Boolean);
      }
      if (Array.isArray(data.categories)) {
        return data.categories.map(normalizeCategory).filter(Boolean);
      }
      if (Array.isArray(data.quickCategories) || Array.isArray(data.megaMenuCategories)) {
        const bundled = [
          ...(data.categories || []),
          ...(data.quickCategories || []),
          ...(data.megaMenuCategories || []),
        ];
        return Array.from(new Map(
          bundled.map((category) => [String(category.id || category.slug), category])
        ).values()).map(normalizeCategory).filter(Boolean);
      }
    }
  } catch (err) {
    console.error('[categoryService] getCategories failed:', err.message);
  }
  return [];
}

export async function getCategoryById(id) {
  try {
    const data = await fetchApi(`/categories/${id}`);
    if (data && data.id) return normalizeCategory(data);
  } catch (err) {
    // fallback
  }
  const all = await getCategories();
  return all.find((c) => c.id === id || c.slug === id) || null;
}

const SPECIAL_CATEGORIES = {
  "new-arrivals": { id: "new-arrivals", name: "Hàng Mới Về", slug: "new-arrivals" },
  "men": { id: "men", name: "Nam", slug: "men" },
  "women": { id: "women", name: "Nữ", slug: "women" },
  "unisex": { id: "unisex", name: "Unisex", slug: "unisex" },
};

export async function getCategoryBySlug(slug) {
  if (!slug) return null;
  if (SPECIAL_CATEGORIES[slug]) return SPECIAL_CATEGORIES[slug];
  return getCategoryById(slug);
}


export async function getCategoryProductCounts() {
  try {
    const data = await fetchApi('/products?limit=200');
    const items = data?.items || [];
    const counts = {};
    items.forEach((p) => {
      const cat = p.category || p.categoryId || p.categorySlug;
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  } catch {
    return {};
  }
}

export async function createCategory(input) {
  const payload = {
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description || "",
    image: input.imageUrl || input.image || null,
    parentId: input.parentId || null,
    type: input.parentId ? "standard" : "quick",
  };
  const created = await fetchApi('/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeCategory(created);
}

export async function updateCategory(id, input) {
  const payload = {
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description || "",
    image: input.imageUrl || input.image || null,
    parentId: input.parentId || null,
  };
  const updated = await fetchApi(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizeCategory(updated);
}

export async function deleteCategory(id) {
  return fetchApi(`/categories/${id}`, {
    method: 'DELETE',
  });
}
