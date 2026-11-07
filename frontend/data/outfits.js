// Outfits data layer
// Note: All mock outfits have been migrated to MySQL Routine DB.
// Data is dynamically retrieved via API (/api/v1/outfits).

export const outfits = [];

export function getOutfitById(id) {
  return outfits.find((o) => o.id === id) || null;
}

export function getFeaturedOutfits(limit = 4) {
  return outfits.slice(0, limit);
}

export function getOutfitsByStyle(style) {
  return outfits.filter((o) => o.style === style);
}

export function getOutfitsByOccasion(occasion) {
  return outfits.filter((o) => o.occasion === occasion);
}
