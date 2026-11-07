const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restockAll(minStock = 100) {
  console.log(`--- RESTOCKING ALL PRODUCTS TO AT LEAST ${minStock} ---`);
  const products = await prisma.product.findMany({
    select: { id: true, name: true, stockQuantity: true }
  });

  let count = 0;
  for (const p of products) {
    if (p.stockQuantity < minStock) {
      await prisma.product.update({
        where: { id: p.id },
        data: { stockQuantity: minStock }
      });
      console.log(`Updated ${p.id} (${p.name}): ${p.stockQuantity} -> ${minStock}`);
      count++;
    }
  }

  console.log(`Restocked ${count} products to ${minStock}.`);
}

// Chạy trực tiếp nếu có tham số
if (require.main === module) {
  const target = process.argv[2] ? Number(process.argv[2]) : 100;
  restockAll(target)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = { restockAll };
