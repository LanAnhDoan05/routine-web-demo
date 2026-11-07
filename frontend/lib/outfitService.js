import { slugify } from "@/data/products";
import { fetchApi } from "./api";

function normalizeOutfit(o) {
  if (!o) return null;
  let rawImgs = [];
  if (Array.isArray(o.images)) {
    rawImgs = o.images;
  } else if (typeof o.images === 'string') {
    try {
      rawImgs = JSON.parse(o.images || '[]');
    } catch {
      rawImgs = [o.images];
    }
  } else if (o.image) {
    rawImgs = [o.image];
  }
  const cover = o.coverImage || o.image || rawImgs[0] || "/images/outfits/outfit-01.jpg";

  return {
    ...o,
    name: o.name || o.title || "Outfit",
    title: o.title || o.name || "Outfit",
    coverImage: cover,
    image: cover,
    images: rawImgs.length > 0 ? rawImgs : [cover],
    styleId: o.styleId || o.style,
    status: o.status || "ACTIVE",
    slug: o.slug || slugify(o.name || o.title || ""),
    products: o.products || [],
    productIds: o.productIds || (o.products ? o.products.map(p => p.id) : []),
    total: o.total || 0,
  };
}

export async function getOutfits() {
  try {
    const data = await fetchApi('/outfits?limit=100');
    if (data && data.items) return data.items.map(normalizeOutfit);
    if (Array.isArray(data)) return data.map(normalizeOutfit);
  } catch (err) {
    console.error('[outfitService] getOutfits failed:', err.message);
  }
  return [];
}

export async function getOutfitById(id) {
  try {
    const data = await fetchApi(`/outfits/${id}`);
    if (data && data.id) return normalizeOutfit(data);
  } catch (err) {
    console.error(`[outfitService] getOutfitById ${id} failed:`, err.message);
  }
  return null;
}

export async function getFeaturedOutfits(limit = 4) {
  try {
    const data = await fetchApi(`/outfits/featured?limit=${limit}`);
    if (Array.isArray(data)) return data.map(normalizeOutfit);
  } catch (err) {
    console.error('[outfitService] getFeaturedOutfits failed:', err.message);
  }
  return [];
}

export async function getRelatedOutfits(id, limit = 4) {
  try {
    const data = await fetchApi(`/outfits/${id}/related?limit=${limit}`);
    if (Array.isArray(data)) return data.map(normalizeOutfit);
  } catch (err) {
    console.error(`[outfitService] getRelatedOutfits ${id} failed:`, err.message);
  }
  return [];
}

export async function createOutfit(input) {
  const cover = input.coverImage || input.image || (Array.isArray(input.images) && input.images[0]) || "/images/outfits/outfit-01.jpg";
  const payload = {
    name: input.name,
    title: input.name,
    style: input.styleId || input.style || "minimal",
    gender: input.gender || "unisex",
    occasion: input.occasion || "everyday",
    image: cover,
    coverImage: cover,
    images: input.images || (cover ? [cover] : []),
    productIds: input.productIds || [],
    description: input.description || "",
    status: input.status || "ACTIVE",
  };
  const created = await fetchApi('/outfits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeOutfit(created);
}

export async function updateOutfit(id, input) {
  const cover = input.coverImage || input.image || (Array.isArray(input.images) && input.images[0]);
  const payload = {
    name: input.name,
    title: input.name,
    style: input.styleId || input.style,
    gender: input.gender,
    occasion: input.occasion,
    image: cover,
    coverImage: cover,
    images: input.images !== undefined ? input.images : (cover ? [cover] : undefined),
    productIds: input.productIds,
    description: input.description,
    status: input.status,
  };
  const updated = await fetchApi(`/outfits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizeOutfit(updated);
}

export async function deleteOutfit(id) {
  return fetchApi(`/outfits/${id}`, {
    method: 'DELETE',
  });
}
