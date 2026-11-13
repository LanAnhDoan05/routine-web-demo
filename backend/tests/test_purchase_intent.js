const test = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyPurchaseIntent,
  scorePurchaseIntent,
} = require('../src/services/purchaseIntentService');

test('scores customer messages only and never counts AI replies', () => {
  const result = scorePurchaseIntent([
    { role: 'CUSTOMER', text: 'Tôi đang tìm áo polo.' },
    { role: 'AI', text: 'Bạn có thể đặt hàng ngay hôm nay.' },
  ]);

  assert.equal(result.userMessageCount, 1);
  assert.equal(result.breakdown.transaction, 0);
});

test('caps each scoring dimension at its documented maximum', () => {
  const result = scorePurchaseIntent([
    ...Array.from({ length: 10 }, () => ({
      role: 'CUSTOMER',
      text: 'Tìm áo polo so sánh mẫu khác nhau, giữa áo và quần, thay thế mẫu, muốn mua và đặt ngay, giao hàng hôm nay, size M màu xanh dưới 800k đi làm.',
    })),
  ]);

  assert.ok(result.breakdown.productInterest <= 20);
  assert.ok(result.breakdown.comparison <= 25);
  assert.ok(result.breakdown.transaction <= 35);
  assert.ok(result.breakdown.specificNeed <= 20);
  assert.equal(result.score, 100);
  assert.equal(result.level, 'VERY_HIGH');
});

test('classifies scores at the exact documented boundaries', () => {
  assert.equal(classifyPurchaseIntent(29), 'LOW');
  assert.equal(classifyPurchaseIntent(30), 'MEDIUM');
  assert.equal(classifyPurchaseIntent(59), 'MEDIUM');
  assert.equal(classifyPurchaseIntent(60), 'HIGH');
  assert.equal(classifyPurchaseIntent(79), 'HIGH');
  assert.equal(classifyPurchaseIntent(80), 'VERY_HIGH');
});

test('does not assign purchase intent to empty or AI-only conversations', () => {
  const result = scorePurchaseIntent([
    { role: 'AI', text: 'Bạn muốn mua hàng không?' },
    { role: 'CUSTOMER', text: ' ' },
  ]);

  assert.equal(result.score, 0);
  assert.equal(result.level, 'LOW');
  assert.equal(result.userMessageCount, 0);
});
