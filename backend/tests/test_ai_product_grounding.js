const test = require('node:test');
const assert = require('node:assert/strict');
const {
  formatProductForStylist,
  formatOutfitForStylist,
  isStandaloneProductRequest,
  productColorMatches,
} = require('../src/services/aiService');

function product(overrides = {}) {
  return {
    id: 'product-1',
    name: 'Áo Routine',
    status: 'ACTIVE',
    price: 500000,
    originalPrice: null,
    stockQuantity: 4,
    images: ['/api/v1/media/image-1'],
    sizes: ['S', 'M'],
    colors: ['Xanh'],
    ...overrides,
  };
}

test('formats only published, in-stock products with real database facts', () => {
  const formatted = formatProductForStylist(product());

  assert.equal(formatted.name, 'Áo Routine');
  assert.equal(formatted.price, 500000);
  assert.equal(formatted.originalPrice, null);
  assert.equal(formatted.stockQuantity, 4);
  assert.deepEqual(formatted.sizes, ['S', 'M']);
  assert.deepEqual(formatted.colors, ['Xanh']);
  assert.equal(formatted.image, '/api/v1/media/image-1');
});

test('excludes unpublished products and products without verified inventory or price', () => {
  assert.equal(formatProductForStylist(product({ status: 'DRAFT' })), null);
  assert.equal(formatProductForStylist(product({ status: 'INACTIVE' })), null);
  assert.equal(formatProductForStylist(product({ stockQuantity: 0 })), null);
  assert.equal(formatProductForStylist(product({ stockQuantity: undefined })), null);
  assert.equal(formatProductForStylist(product({ price: null })), null);
  assert.equal(formatProductForStylist(product({ images: [] })), null);
  assert.equal(formatProductForStylist(product({ images: ['/images/placeholder.jpg'] })), null);
});

test('does not invent sizes, colors, or inventory when database facts are absent', () => {
  const formatted = formatProductForStylist(product({
    sizes: null,
    colors: null,
    stockQuantity: null,
    variants: [],
  }));

  assert.equal(formatted, null);
});

test('uses only available active variants when the product has variants', () => {
  const formatted = formatProductForStylist(product({
    sizes: ['S', 'M', 'L'],
    colors: ['Đỏ', 'Xanh'],
    variants: [
      { size: 'M', color: 'Xanh', price: 520000, stockQuantity: 2, status: 'ACTIVE' },
      { size: 'L', color: 'Đỏ', price: 500000, stockQuantity: 0, status: 'ACTIVE' },
      { size: 'S', color: 'Đỏ', price: 500000, stockQuantity: 4, status: 'INACTIVE' },
    ],
  }));

  assert.deepEqual(formatted.sizes, ['M']);
  assert.deepEqual(formatted.colors, ['Xanh']);
  assert.equal(formatted.selectedSize, 'M');
  assert.equal(formatted.selectedColor, 'Xanh');
  assert.equal(formatted.price, 520000);
});

test('does not return a curated outfit containing a hidden product', () => {
  const outfit = formatOutfitForStylist({
    id: 'outfit-1',
    products: [
      { product: product({ id: 'product-1' }) },
      { product: product({ id: 'product-2', status: 'INACTIVE' }) },
    ],
  });

  assert.equal(outfit, null);
});

test('prefers a single product card for item-specific questions, not a random outfit', () => {
  assert.equal(isStandaloneProductRequest(
    { season: 'autumn-winter', color: 'nâu' },
    'áo thu đông màu nâu'
  ), 'outerwear');
  assert.equal(isStandaloneProductRequest(
    { categories: ['ao-polo'] },
    'tôi muốn tìm hiểu về áo polo cho nam'
  ), 'top');
  assert.equal(isStandaloneProductRequest(
    { categories: ['ao-polo', 'quan-tay'] },
    'áo polo kết hợp quần tây'
  ), null);
});

test('matches Vietnamese requested colors with catalog color names', () => {
  assert.equal(productColorMatches(['Brown', 'Camel', 'Black'], 'nâu'), true);
  assert.equal(productColorMatches(['Grey'], 'xám'), true);
  assert.equal(productColorMatches(['White'], 'đen'), false);
});
