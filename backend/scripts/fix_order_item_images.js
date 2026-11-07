const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- FIXING ORDER ITEM IMAGES IN MYSQL ---');
  
  // 1. Lấy toàn bộ sản phẩm và ảnh đại diện thật của chúng
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true }
  });
  
  const productImgMap = {};
  products.forEach(p => {
    let imgs = p.images;
    if (typeof imgs === 'string') {
      try { imgs = JSON.parse(imgs); } catch (e) { imgs = []; }
    }
    if (Array.isArray(imgs) && imgs.length > 0 && imgs[0]) {
      productImgMap[p.id] = imgs[0];
    }
  });

  console.log(`Loaded real images for ${Object.keys(productImgMap).length} products.`);

  // 2. Lấy toàn bộ order items
  const items = await prisma.orderItem.findMany({
    select: { id: true, orderId: true, productId: true, name: true, image: true }
  });

  let updatedCount = 0;
  for (const item of items) {
    const realImg = productImgMap[item.productId];
    if (realImg) {
      // Nếu image hiện tại rỗng, hoặc trỏ đến đường dẫn ảo không tồn tại, cập nhật sang ảnh thật
      const isDeadPath = !item.image || 
        item.image.includes('/images/products/product-') || 
        item.image.includes('/images/products/test.jpg') || 
        item.image.includes('/images/products/men-') ||
        item.image.trim() === '';

      if (isDeadPath) {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { image: realImg }
        });
        console.log(`Updated Order ${item.orderId} Item ${item.productId} (${item.name}) -> ${realImg}`);
        updatedCount++;
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} order items to valid product images!`);

  // Verify all items now
  const remainingDead = await prisma.orderItem.findMany({
    where: {
      OR: [
        { image: null },
        { image: '' },
        { image: { contains: 'product-' } },
        { image: { contains: 'test.jpg' } }
      ]
    }
  });
  console.log(`Remaining dead image items: ${remainingDead.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
