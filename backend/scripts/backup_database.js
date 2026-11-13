const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '../.backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('=== BẮT ĐẦU SAO LƯU CƠ SỞ DỮ LIỆU MYSQL (PHASE 01) ===');

  // 1. Kiểm tra kết nối và Database name
  const dbInfo = await prisma.$queryRawUnsafe('SELECT DATABASE() as db_name, VERSION() as db_version');
  const currentDb = dbInfo[0]?.db_name;
  const dbVersion = dbInfo[0]?.db_version;
  console.log(`Database đang sử dụng: ${currentDb}`);
  console.log(`MySQL Version: ${dbVersion}`);

  // 2. Thống kê số bảng
  const rawTables = await prisma.$queryRawUnsafe('SHOW TABLES');
  const tableNames = rawTables.map(r => Object.values(r)[0]);
  console.log(`Tổng số bảng phát hiện trong MySQL: ${tableNames.length}`);

  // 3. Đọc dữ liệu từng bảng và lưu JSON
  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      database: currentDb,
      version: dbVersion,
      totalTables: tableNames.length,
    },
    tables: {}
  };

  const tableStats = {};

  for (const table of tableNames) {
    try {
      // Đối với bảng media_files: do có cột data LONGBLOB rất lớn, ta lưu metadata và độ dài blob
      if (table === 'media_files') {
        const rows = await prisma.$queryRawUnsafe('SELECT id, filename, mimetype, size, created_at, LENGTH(data) as blob_bytes FROM `media_files`');
        backupData.tables[table] = rows;
        tableStats[table] = rows.length;
        console.log(`  [Table] ${table.padEnd(28)}: ${rows.length} records (Blob metadata)`);
      } else {
        const rows = await prisma.$queryRawUnsafe(`SELECT * FROM \`${table}\``);
        backupData.tables[table] = rows;
        tableStats[table] = rows.length;
        console.log(`  [Table] ${table.padEnd(28)}: ${rows.length} records`);
      }
    } catch (err) {
      console.error(`  [Table] ${table.padEnd(28)}: LỖI ĐỌC - ${err.message}`);
      backupData.tables[table] = { error: err.message };
    }
  }

  // 4. Lưu ra file JSON (hỗ trợ BigInt an toàn)
  const safeJson = JSON.stringify(backupData, (key, value) => {
    return typeof value === 'bigint' ? value.toString() : value;
  }, 2);
  const jsonBackupFile = path.join(backupDir, `backup_${currentDb}_${timestamp}.json`);
  fs.writeFileSync(jsonBackupFile, safeJson, 'utf8');

  const stats = fs.statSync(jsonBackupFile);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`\n✅ Đã lưu bản sao lưu JSON: ${jsonBackupFile} (${sizeKB} KB)`);

  // 5. Thống kê chi tiết các thực thể quan trọng
  console.log('\n=== THỐNG KÊ CHI TIẾT CÁC THỰC THỂ QUAN TRỌNG TRƯỚC SỬA ĐỔI ===');
  console.log(`- Tổng sản phẩm (products):           ${tableStats['products'] || 0}`);
  console.log(`- Tổng biến thể (product_variants):    ${tableStats['product_variants'] || 0}`);
  console.log(`- Tổng danh mục (categories):          ${tableStats['categories'] || 0}`);
  console.log(`- Tổng tài khoản (users):             ${tableStats['users'] || 0}`);
  console.log(`- Tổng đơn hàng (orders):             ${tableStats['orders'] || 0}`);
  console.log(`- Tổng chi tiết đơn (order_items):     ${tableStats['order_items'] || 0}`);
  console.log(`- Tổng giỏ hàng (carts / cart_items):  ${tableStats['carts'] || 0} / ${tableStats['cart_items'] || 0}`);
  console.log(`- Tổng media files (media_files):      ${tableStats['media_files'] || 0}`);
  console.log(`- Tổng hội thoại AI (ai_conversations): ${tableStats['ai_conversations'] || 0}`);
  console.log(`- Tổng tin nhắn AI (ai_conv_messages): ${tableStats['ai_conversation_messages'] || 0}`);
  console.log(`- Bảng stores:                        ${tableNames.includes('stores') ? 'ĐÃ CÓ' : 'CHƯA CÓ (Sẽ tạo ở Bước 3)'}`);
  console.log('===============================================================');

  return { jsonBackupFile, tableStats };
}

fullBackup()
  .catch((err) => {
    console.error('❌ SAO LƯU THẤT BẠI:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
