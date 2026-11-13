require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../../src/config/prisma');

const outputRoot = path.join(__dirname, 'output');

async function createBackup() {
  const [categories, products, mediaFiles] = await Promise.all([
    prisma.category.findMany(),
    prisma.product.findMany({ include: { variants: true } }),
    prisma.mediaFile.findMany({
      select: { id: true, filename: true, mimetype: true, size: true, createdAt: true },
    }),
  ]);
  const backup = {
    backedUpAt: new Date().toISOString(),
    tables: {
      categories: { count: categories.length, records: categories },
      products: { count: products.length, records: products },
      mediaFiles: {
        count: mediaFiles.length,
        records: mediaFiles,
        binaryDataIncluded: false,
        note: 'Import only creates product rows and does not modify media_files binary data.',
      },
    },
  };
  fs.mkdirSync(outputRoot, { recursive: true });
  const filename = `database-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const backupPath = path.join(outputRoot, filename);
  fs.writeFileSync(backupPath, `${JSON.stringify(backup, null, 2)}\n`, { flag: 'wx' });
  return backupPath;
}

if (require.main === module) {
  createBackup()
    .then((backupPath) => console.log(`Database backup created: ${backupPath}`))
    .catch((error) => {
      console.error('Không thể sao lưu dữ liệu trước import:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { createBackup };
