const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- ENRICHING USERS & ORDERS ATTRIBUTION SOURCES ---');

  // 1. Cập nhật nguồn đăng ký của khách hàng thành viên
  const userUpdates = [
    { id: 'usr-customer-002', source: 'TIKTOK' },      // Trần Thị Bích Ngọc đến từ TikTok
    { id: 'usr-customer-003', source: 'FACEBOOK' },    // Lê Hoàng Long đến từ Facebook
    { id: 'usr-customer-004', source: 'INSTAGRAM' },   // Phạm Minh Trang đến từ Instagram
    { id: 'usr-customer-005', source: 'TIKTOK' },      // Vũ Đức Thắng đến từ TikTok
    { id: '9b89e0d8-213d-407f-86af-a33c11d3b66a', source: 'TIKTOK' }, // Người Đẹp Đất Cảng đến từ TikTok
  ];

  for (const u of userUpdates) {
    await prisma.user.updateMany({
      where: { id: u.id },
      data: { source: u.source },
    });
    console.log(`Updated user ${u.id} source to ${u.source}`);
  }

  // 2. Cập nhật attributionSource cho các đơn hàng tương ứng
  const orderSourceMap = {
    'ORD-2026-0004': 'TIKTOK',     // Đơn của Trần Thị Bích Ngọc
    'ORD-2026-0005': 'FACEBOOK',   // Đơn của Lê Hoàng Long
    'ORD-2026-0006': 'INSTAGRAM',  // Đơn của Phạm Minh Trang
    'ORD-2026-0007': 'TIKTOK',     // Khách vãng lai từ video TikTok
    'ORD-2026-0008': 'FACEBOOK',   // Khách vãng lai từ chiến dịch Facebook
    'ORD-2026-0009': 'INSTAGRAM',  // Khách vãng lai từ Instagram Reels
    'ORD-2026-0010': 'TIKTOK',     // Đơn từ TikTok Shop / bio link
    'ORD-2026-0011': 'FACEBOOK',   // Đơn từ Facebook Fanpage
    'ORD-2026-0012': 'INSTAGRAM',  // Đơn từ Instagram Story
    'ORD-2026-0016': 'TIKTOK',
    'ORD-2026-0017': 'FACEBOOK',
    'ORD-2026-0023': 'TIKTOK',     // Đơn của Người Đẹp Đất Cảng
    'ORD-2026-0024': 'TIKTOK',     // Đơn của Người Đẹp Đất Cảng
    'ORD-2026-0025': 'INSTAGRAM',  // Đơn của Người Đẹp Đất Cảng
    'ORD-2026-0027': 'FACEBOOK',   // Đơn của Người Đẹp Đất Cảng
  };

  for (const [orderId, source] of Object.entries(orderSourceMap)) {
    await prisma.order.updateMany({
      where: { id: orderId },
      data: { attributionSource: source },
    });
    console.log(`Updated order ${orderId} attributionSource to ${source}`);
  }

  console.log('\n--- VERIFYING ATTRIBUTION STATS AFTER ENRICHMENT ---');
  const allOrders = await prisma.order.findMany({
    select: { id: true, attributionSource: true, userId: true }
  });
  const counts = {};
  allOrders.forEach(o => {
    const s = o.attributionSource || 'ORGANIC';
    counts[s] = (counts[s] || 0) + 1;
  });
  console.log('Attribution Sources:', counts);

  const memberOrders = allOrders.filter(o => o.userId).length;
  const guestOrders = allOrders.filter(o => !o.userId).length;
  console.log(`Orders by Members: ${memberOrders} | Orders by Guests: ${guestOrders}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
