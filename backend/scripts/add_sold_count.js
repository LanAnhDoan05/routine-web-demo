const prisma = require('../src/config/prisma');

async function main() {
  console.log('--- Kiểm tra và cập nhật cột sold_count cho bảng products ---');
  try {
    const columns = await prisma.$queryRawUnsafe('DESCRIBE products;');
    const fields = columns.map((c) => c.Field);
    console.log('Các cột hiện tại:', fields);

    if (!fields.includes('sold_count')) {
      console.log('Thêm cột sold_count vào bảng products...');
      await prisma.$queryRawUnsafe('ALTER TABLE products ADD COLUMN sold_count INT NOT NULL DEFAULT 0;');
      console.log('Đã thêm cột sold_count thành công.');
    } else {
      console.log('Cột sold_count đã tồn tại.');
    }

    console.log('Cập nhật toàn bộ sản phẩm lên 99 sản phẩm đã bán theo yêu cầu...');
    const updateResult = await prisma.$queryRawUnsafe('UPDATE products SET sold_count = 99;');
    console.log('Kết quả cập nhật:', updateResult);

    const products = await prisma.$queryRawUnsafe('SELECT id, name, sold_count FROM products LIMIT 5;');
    console.log('Mẫu 5 sản phẩm sau khi cập nhật:');
    console.table(products);

    console.log('Hoàn thành xuất sắc!');
  } catch (error) {
    console.error('Lỗi khi thực hiện:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
