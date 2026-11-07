// Mock product catalog has been migrated to MySQL Database (routine_db).
// All product operations now query directly through Prisma ORM.

const products = [];

function getProductById(id) {
  return null;
}

function getProductsByIds(ids = []) {
  return [];
}

function getRelatedProducts(product, limit = 4) {
  return [];
}

module.exports = { products, getProductById, getProductsByIds, getRelatedProducts };
