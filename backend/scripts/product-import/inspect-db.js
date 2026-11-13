require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../../src/config/prisma');

const outputRoot = path.join(__dirname, 'output');

async function main() {
  const [categories, productCount, productStatusGroups, genderGroups, productSamples, mediaCount] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, slug: true, name: true, parentId: true, type: true },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    }),
    prisma.product.count(),
    prisma.product.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.product.groupBy({ by: ['gender'], _count: { _all: true } }),
    prisma.product.findMany({
      select: { id: true, name: true, slug: true, categorySlug: true, gender: true, status: true, price: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.mediaFile.count(),
  ]);
  const report = {
    inspectedAt: new Date().toISOString(),
    categories,
    productCount,
    productStatusGroups,
    genderGroups,
    productSamples,
    mediaFileCount: mediaCount,
  };
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, 'database-inspection.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error('Không thể kiểm tra database:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
