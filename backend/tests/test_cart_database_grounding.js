const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveCartSelection } = require('../src/services/cartService');

function product(overrides = {}) {
  return {
    id: 'product-1',
    status: 'ACTIVE',
    price: 500000,
    stockQuantity: 3,
    sizes: ['S', 'M'],
    colors: ['Xanh', 'Đen'],
    variants: [],
    ...overrides,
  };
}

test('rejects products that are hidden or absent from the database', () => {
  assert.throws(
    () => resolveCartSelection(null, { quantity: 1 }),
    (error) => error.statusCode === 404
  );
  assert.throws(
    () => resolveCartSelection(product({ status: 'DRAFT' }), { quantity: 1 }),
    (error) => error.statusCode === 404
  );
});

test('rejects fabricated options and selections without exact variant stock', () => {
  const withVariants = product({
    variants: [
      { size: 'M', color: 'Xanh', price: 550000, stockQuantity: 2, status: 'ACTIVE' },
      { size: 'S', color: 'Đen', price: 500000, stockQuantity: 0, status: 'ACTIVE' },
    ],
  });

  assert.throws(
    () => resolveCartSelection(withVariants, { size: 'S', color: 'Đen', quantity: 1 }),
    (error) => error.statusCode === 400
  );
  assert.throws(
    () => resolveCartSelection(withVariants, { size: 'M', color: 'Đen', quantity: 1 }),
    (error) => error.statusCode === 400
  );
  assert.throws(
    () => resolveCartSelection(product(), { size: 'XXL', color: 'Đen', quantity: 1 }),
    (error) => error.statusCode === 400
  );
});

test('uses the database variant price and refuses quantities above its stock', () => {
  const withVariants = product({
    variants: [
      { size: 'M', color: 'Xanh', price: 550000, stockQuantity: 2, status: 'ACTIVE' },
    ],
  });

  assert.deepEqual(
    resolveCartSelection(withVariants, { size: 'M', color: 'Xanh', quantity: 2 }),
    {
      size: 'M',
      color: 'Xanh',
      price: 550000,
      availableStock: 2,
      quantity: 2,
    }
  );
  assert.throws(
    () => resolveCartSelection(withVariants, { size: 'M', color: 'Xanh', quantity: 3 }),
    (error) => error.statusCode === 400
  );
});

test('does not invent default size or color for database products without those options', () => {
  const selected = resolveCartSelection(product({
    sizes: null,
    colors: null,
    stockQuantity: 2,
  }), { quantity: 1 });

  assert.equal(selected.size, null);
  assert.equal(selected.color, null);
});
