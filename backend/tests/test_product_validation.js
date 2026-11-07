const test = require('node:test');
const assert = require('node:assert/strict');
const { createProduct } = require('../src/services/productService');

const validProduct = {
  name: 'Áo kiểm thử',
  category: 'tops',
  gender: 'unisex',
  price: 250000,
  description: 'Sản phẩm dùng để kiểm tra validation.',
  images: ['/api/v1/media/audit-image'],
  variants: [{ sku: 'AUDIT-TEE-BLK-M', colorName: 'Đen', sizeName: 'M', price: 250000, stockQuantity: 2 }],
};

test('rejects invalid products before attempting database writes', async (t) => {
  const invalidCases = [
    ['missing name', { ...validProduct, name: '' }],
    ['missing category', { ...validProduct, category: '' }],
    ['missing description', { ...validProduct, description: '' }],
    ['non-positive price', { ...validProduct, price: 0 }],
    ['missing image', { ...validProduct, images: [] }],
    ['missing variant SKU', { ...validProduct, variants: [{ ...validProduct.variants[0], sku: '' }] }],
    ['missing variant size', { ...validProduct, variants: [{ ...validProduct.variants[0], sizeName: '' }] }],
    ['negative variant stock', { ...validProduct, variants: [{ ...validProduct.variants[0], stockQuantity: -1 }] }],
  ];

  for (const [label, product] of invalidCases) {
    await t.test(label, async () => {
      await assert.rejects(createProduct(product), (error) => error.statusCode === 400);
    });
  }
});