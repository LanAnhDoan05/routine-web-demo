const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.orderItem.findMany({
    select: {
      id: true,
      orderId: true,
      productId: true,
      name: true,
      image: true,
    }
  });

  console.log(`Total order items: ${items.length}`);
  const emptyImages = items.filter(i => !i.image || i.image.trim() === '');
  console.log(`Items with empty image: ${emptyImages.length}`);
  
  console.log('\n--- ALL ORDER ITEMS IMAGES ---');
  items.forEach(i => {
    console.log(`Order: ${i.orderId} | ProductId: ${i.productId} | Name: ${i.name} | Image: "${i.image}"`);
  });

  // Check corresponding products in product table
  const productIds = Array.from(new Set(items.map(i => i.productId).filter(Boolean)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, images: true }
  });
  console.log('\n--- PRODUCTS IN DB FOR THESE ORDER ITEMS ---');
  products.forEach(p => {
    console.log(`Product: ${p.id} | Name: ${p.name} | Images: ${JSON.stringify(p.images)}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
