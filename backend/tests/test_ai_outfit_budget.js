const test = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../src/config/prisma');
const aiService = require('../src/services/aiService');

function product(id, name, categorySlug, price, isFeatured = false) {
  return {
    id,
    name,
    categorySlug,
    gender: 'unisex',
    status: 'ACTIVE',
    price,
    stockQuantity: 10,
    isFeatured,
    images: [`/api/v1/media/${id}`],
    colors: ['Black'],
    sizes: ['M'],
    variants: [],
  };
}

test('chooses a lower-scored real product pair when the top pair exceeds budget', async () => {
  const originalFindMany = prisma.product.findMany;
  prisma.product.findMany = async () => [
    product('top-featured', 'Featured Polo', 'tops', 700000, true),
    product('top-budget', 'Basic Cotton Tee', 'tops', 300000),
    product('bottom-featured', 'Featured Trousers', 'bottoms', 700000, true),
    product('bottom-budget', 'Straight Jeans', 'bottoms', 300000),
  ];

  try {
    const outfit = await aiService.assembleDynamicOutfit(
      { gender: 'unisex', budget: 1000000 },
      null,
      'Phối cho tôi một outfit dưới 1 triệu.',
    );
    assert.ok(outfit);
    assert.equal(outfit.products.length, 2);
    assert.ok(outfit.products.every((item) => ['top-featured', 'top-budget', 'bottom-featured', 'bottom-budget'].includes(item.id)));
    assert.ok(outfit.total <= 1000000);
  } finally {
    prisma.product.findMany = originalFindMany;
  }
});
