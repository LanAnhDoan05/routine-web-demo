// Mock categories have been migrated to MySQL Database (routine_db).
// All category operations now query directly through Prisma ORM via categoryService.

const quickCategories = [];
const megaMenuCategories = [];
const categories = [];

module.exports = {
  quickCategories,
  megaMenuCategories,
  categories,
};
