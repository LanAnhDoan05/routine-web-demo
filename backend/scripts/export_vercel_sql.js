const prisma = require('../src/config/prisma');
const fs = require('fs');
const path = require('path');

async function exportSql() {
  const products = await prisma.product.findMany({
    select: { id: true, images: true, badge: true, createdAt: true }
  });

  const lines = [
    '-- SQL SCRIPT CẬP NHẬT ẢNH SẢN PHẨM TRÊN VERCEL / AIVEN CLOUD DATABASE',
    '-- Chạy script này trên Cloud MySQL để đồng bộ ảnh sản phẩm đẹp 100%',
    '',
    'START TRANSACTION;',
    ''
  ];

  for (const p of products) {
    const imagesJson = JSON.stringify(p.images || []).replace(/'/g, "\\'");
    const badgeVal = p.badge ? `'${p.badge}'` : 'NULL';
    const createdAtStr = p.createdAt ? p.createdAt.toISOString().slice(0, 19).replace('T', ' ') : 'NOW()';
    lines.push(`UPDATE \`products\` SET \`images\` = '${imagesJson}', \`badge\` = ${badgeVal}, \`created_at\` = '${createdAtStr}' WHERE \`id\` = '${p.id}';`);
  }

  // Cập nhật order_items
  const orderItems = await prisma.orderItem.findMany({
    select: { id: true, image: true }
  });
  lines.push('');
  lines.push('-- Cập nhật ảnh cho order_items');
  for (const oi of orderItems) {
    if (oi.image) {
      lines.push(`UPDATE \`order_items\` SET \`image\` = '${oi.image.replace(/'/g, "\\'")}' WHERE \`id\` = '${oi.id}';`);
    }
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');

  const targetFile = path.resolve(__dirname, 'update_database_for_vercel.sql');
  fs.writeFileSync(targetFile, lines.join('\n'), 'utf8');
  console.log(`Đã xuất tệp SQL thành công: ${targetFile} (${lines.length} dòng)`);
  process.exit(0);
}

exportSql().catch(e => {
  console.error(e);
  process.exit(1);
});
