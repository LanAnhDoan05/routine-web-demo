const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      userId: true,
      guestSessionId: true,
      receiverName: true,
      phoneNumber: true,
      shippingAddress: true,
      attributionSource: true,
      total: true,
      orderStatus: true,
      paymentStatus: true,
      user: {
        select: { id: true, fullName: true, email: true, source: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('Total orders in DB:', orders.length);
  const userOrderCount = orders.filter(o => o.userId).length;
  const guestOrderCount = orders.filter(o => !o.userId).length;
  console.log('Orders with userId:', userOrderCount, 'Orders without userId (guest):', guestOrderCount);

  const sources = {};
  orders.forEach(o => {
    const src = o.attributionSource || 'NULL';
    sources[src] = (sources[src] || 0) + 1;
  });
  console.log('Attribution sources distribution:', sources);

  console.log('\n--- ALL ORDERS SUMMARY ---');
  orders.forEach((o, index) => {
    console.log(`[${index + 1}] ID: ${o.id} | UserID: ${o.userId || 'NULL'} | User: ${o.user ? `${o.user.fullName} (${o.user.email})` : 'NO_USER'} | Receiver: ${o.receiverName} | Phone: ${o.phoneNumber} | Source: ${o.attributionSource}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
