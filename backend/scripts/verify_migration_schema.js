const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('=== ĐỐI CHIẾU CẤU TRÚC DATABASE THỰC TẾ VỚI 4 MIGRATION ===\n');

  // 1. Kiểm tra bảng stock_reservations (Migration 20260908000000)
  const stockCols = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stock_reservations'
  `);
  console.log('1. Bảng stock_reservations:', stockCols.length ? 'ĐÃ TỒN TẠI' : 'CHƯA CÓ');
  stockCols.forEach(c => console.log(`   - ${c.COLUMN_NAME} (${c.DATA_TYPE}, key: ${c.COLUMN_KEY})`));

  // 2. Kiểm tra products.status và bảng product_variants (Migration 20261029000000)
  const prodStatusCol = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME, COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'status'
  `);
  console.log('\n2. Cột products.status:', prodStatusCol.length ? `ĐÃ CÓ (${prodStatusCol[0].COLUMN_TYPE})` : 'CHƯA CÓ');

  const variantCols = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants'
  `);
  console.log('   Bảng product_variants:', variantCols.length ? 'ĐÃ TỒN TẠI' : 'CHƯA CÓ');
  variantCols.forEach(c => console.log(`   - ${c.COLUMN_NAME} (${c.DATA_TYPE}, key: ${c.COLUMN_KEY})`));

  // 3. Kiểm tra ai_conversations & ai_conversation_messages (Migration 20261108000000)
  const aiConvCols = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_conversations'
  `);
  console.log('\n3. Bảng ai_conversations:', aiConvCols.length ? `ĐÃ TỒN TẠI (${aiConvCols.length} cột)` : 'CHƯA CÓ');

  // 4. Kiểm tra media_files (Migration 20261108000100)
  const mediaCols = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_files'
  `);
  console.log('\n4. Bảng media_files:', mediaCols.length ? `ĐÃ TỒN TẠI (${mediaCols.length} cột)` : 'CHƯA CÓ');
  mediaCols.forEach(c => console.log(`   - ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

  // 5. Kiểm tra _prisma_migrations
  const appliedMigrations = await prisma.$queryRawUnsafe(`
    SELECT id, migration_name, finished_at, applied_steps_count
    FROM _prisma_migrations
    ORDER BY finished_at ASC
  `);
  console.log('\n5. Lịch sử _prisma_migrations hiện tại:');
  appliedMigrations.forEach(m => console.log(`   - ${m.migration_name} (finished: ${m.finished_at})`));
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
