const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      category: { select: { name: true } },
    },
    orderBy: { stockQuantity: 'asc' }
  });

  console.log(`Total products: ${products.length}`);
  console.log('\n--- ALL PRODUCTS STOCK QUANTITY ---');
  products.forEach((p, idx) => {
    console.log(`[${idx + 1}] ID: ${p.id} | Name: ${p.name.padEnd(30)} | Stock: ${p.stockQuantity} | Category: ${p.category?.name}`);
  });

  const lowStock = products.filter(p => p.stockQuantity <= 15 && p.stockQuantity > 0);
  const outOfStock = products.filter(p => p.stockQuantity === 0);
  const over100 = products.filter(p => p.stockQuantity >= 100);

  console.log('\n--- SUMMARY ---');
  console.log(`Out of stock (= 0): ${outOfStock.length}`);
  console.log(`Low stock (1 - 15): ${lowStock.length}`);
  console.log(`Stock >= 100: ${over100.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
