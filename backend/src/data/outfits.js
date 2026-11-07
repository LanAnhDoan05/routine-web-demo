// Mock outfits have been migrated to MySQL Database (routine_db).
// All outfit operations now query directly through Prisma ORM via outfitService.

const outfits = [];

function getOutfitById(id) {
  return null;
}

function getFeaturedOutfits(limit = 4) {
  return [];
}

function getOutfitsByStyle(style) {
  return [];
}

function getOutfitsByOccasion(occasion) {
  return [];
}

module.exports = {
  outfits,
  getOutfitById,
  getFeaturedOutfits,
  getOutfitsByStyle,
  getOutfitsByOccasion,
};
