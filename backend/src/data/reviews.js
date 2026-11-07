// Mock reviews have been migrated to MySQL Database (routine_db).
// All review operations now query directly through Prisma ORM via reviewService.

const reviews = [];

module.exports = {
  reviews,
};
