// Mock orders have been migrated to MySQL Database (routine_db).
// All order operations now query directly through Prisma ORM via orderService.

const seedOrders = [];
const orders = [];

module.exports = {
  seedOrders,
  orders,
};
