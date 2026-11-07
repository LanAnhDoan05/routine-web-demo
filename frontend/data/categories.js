// Categories data layer
// Note: All mock categories have been migrated to MySQL Routine DB.
// Data is dynamically retrieved via API (/api/v1/categories).

export const quickCategories = [];
export const megaMenuCategories = [];
export const categories = [];

export function getCategoryBySlug(slug) {
  return categories.find((c) => c.slug === slug || c.id === slug) || null;
}

export function getCategoryById(id) {
  if (!id) return null;
  return categories.find((c) => c.id === id || c.slug === id) || null;
}

export function getSelectableCategories() {
  return categories.map((c) => ({
    id: c.id || c.slug,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId || null,
  }));
}
