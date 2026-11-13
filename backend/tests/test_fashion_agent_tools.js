const test = require('node:test');
const assert = require('node:assert/strict');
const { createFashionToolHandlers } = require('../src/services/fashionAgentTools');

const catalog = [
  {
    id: 'shirt-white',
    name: 'White Cotton Shirt',
    category: 'ao',
    categorySlug: 'ao',
    status: 'ACTIVE',
    price: 450000,
    stockQuantity: 4,
    availableStock: 4,
    colors: ['White'],
    sizes: ['S', 'M'],
    variants: [
      { id: 'v1', sku: 'WHITE-S', sizeName: 'S', colorName: 'White', price: 450000, stockQuantity: 2, status: 'ACTIVE' },
      { id: 'v2', sku: 'WHITE-M', sizeName: 'M', colorName: 'White', price: 450000, stockQuantity: 2, status: 'ACTIVE' },
    ],
  },
  {
    id: 'shirt-black',
    name: 'Black Cotton Shirt',
    category: 'ao',
    categorySlug: 'ao',
    status: 'ACTIVE',
    price: 400000,
    stockQuantity: 3,
    availableStock: 3,
    colors: ['Black'],
    sizes: ['M'],
    variants: [],
  },
  {
    id: 'white-tee',
    name: 'Essential Cotton T-Shirt',
    category: 'ao',
    categorySlug: 'ao',
    status: 'ACTIVE',
    price: 299000,
    stockQuantity: 10,
    availableStock: 10,
    colors: ['White'],
    sizes: ['M'],
    variants: [],
  },
  {
    id: 'jeans',
    name: 'Blue Jeans',
    category: 'quan-jeans',
    categorySlug: 'quan-jeans',
    status: 'ACTIVE',
    price: 500000,
    stockQuantity: 2,
    availableStock: 2,
    colors: ['Blue'],
    sizes: ['M'],
    variants: [],
  },
  {
    id: 'hidden-shirt',
    name: 'Hidden Shirt',
    category: 'ao-somi',
    categorySlug: 'ao-somi',
    status: 'INACTIVE',
    price: 100000,
    stockQuantity: 10,
    availableStock: 10,
    colors: ['White'],
    sizes: ['M'],
    variants: [],
  },
];

function createHarness({ history = [], outfit = null, onGetProducts } = {}) {
  const productService = {
    getProducts: async (filters) => {
      onGetProducts?.(filters);
      return { items: catalog };
    },
    getProductById: async (id) => catalog.find((product) => product.id === id) || null,
  };
  const formatProduct = (product, intent = {}) => (
    product?.status === 'ACTIVE' && Number(product.availableStock) > 0
      ? {
        id: product.id,
        name: product.name,
        price: product.price,
        image: `/media/${product.id}`,
        images: [`/media/${product.id}`],
        colors: product.colors,
        sizes: product.sizes,
        variants: product.variants,
        stockQuantity: product.availableStock,
        category: product.categorySlug,
        selectedColor: intent.color || product.colors[0],
      }
      : null
  );
  const productColorMatches = (colors, color) => (
    colors.some((candidate) => {
      const actual = String(candidate).toLowerCase();
      const expected = String(color).toLowerCase();
      return actual.includes(expected) || (expected === 'trắng' && actual.includes('white'));
    })
  );
  const assembleDynamicOutfit = async () => outfit;
  return createFashionToolHandlers({
    productService,
    formatProduct,
    productColorMatches,
    assembleDynamicOutfit,
    message: 'Phối cho tôi một bộ đồ đi làm.',
    history,
    userPreferences: { gender: 'unisex' },
  });
}

test('search_products returns only active in-stock products matching catalog filters', async () => {
  const executeTool = createHarness();
  const result = await executeTool('search_products', {
    category: 'áo sơ mi',
    color: 'trắng',
    priceMax: 500000,
  });
  assert.deepEqual(result.products.map((product) => product.id), ['shirt-white']);
  assert.equal(result.catalogFacts[0].price, 450000);
});

test('details and sizes use real product and per-variant stock facts', async () => {
  const executeTool = createHarness();
  const details = await executeTool('get_product_details', { productId: 'shirt-white' });
  const sizes = await executeTool('get_available_sizes', { productId: 'shirt-white' });
  const missing = await executeTool('get_product_details', { productId: 'not-in-catalog' });
  assert.equal(details.details.name, 'White Cotton Shirt');
  assert.deepEqual(sizes.availableSizes.map(({ size, stockQuantity }) => [size, stockQuantity]), [['S', 2], ['M', 2]]);
  assert.equal(missing.found, false);
});

test('recommend_outfit delegates product selection to the catalog-backed outfit builder', async () => {
  let observedIntent;
  const executeTool = createFashionToolHandlers({
    productService: {
      getProducts: async () => ({ items: catalog }),
      getProductById: async () => null,
    },
    formatProduct: (product) => product,
    productColorMatches: () => true,
    assembleDynamicOutfit: async (intent) => {
      observedIntent = intent;
      return { id: 'outfit-db', total: 900000, products: [catalog[0], catalog[2]] };
    },
    message: 'Phối cho tôi một bộ đồ đi làm dưới 1 triệu.',
    history: [],
    userPreferences: null,
  });
  const result = await executeTool('recommend_outfit', { occasion: 'office', budget: 1000000 });
  assert.equal(result.found, true);
  assert.equal(result.outfit.id, 'outfit-db');
  assert.equal(observedIntent.occasion, 'office');
  assert.equal(observedIntent.budget, 1000000);
});

test('replace_outfit_item keeps prior items and selects a different matching catalog product', async () => {
  const executeTool = createHarness({
    history: [{ role: 'model', productIds: ['shirt-black', 'jeans'] }],
  });
  const result = await executeTool('replace_outfit_item', {
    replaceType: 'top',
    category: 'áo sơ mi',
    color: 'trắng',
    budget: 1000000,
  });
  assert.equal(result.replaced, true);
  assert.deepEqual(result.outfit.products.map((product) => product.id), ['jeans', 'shirt-white']);
  assert.equal(result.outfit.total, 950000);
});

test('recognizes general-category blouses as tops when replacing an outfit item', async () => {
  catalog.push({
    ...catalog[0],
    id: 'silk-blouse',
    name: 'Silk Blend Blouse',
    price: 349000,
    colors: ['White'],
  });

  try {
    const executeTool = createHarness({
      history: [{ role: 'model', productIds: ['silk-blouse', 'jeans'] }],
    });
    const result = await executeTool('replace_outfit_item', {
      replaceType: 'top',
      category: 'áo sơ mi',
      color: 'trắng',
      budget: 1000000,
    });
    assert.equal(result.replaced, true);
    assert.deepEqual(result.outfit.products.map((product) => product.id), ['jeans', 'shirt-white']);
    assert.equal(result.outfit.total, 950000);
  } finally {
    catalog.pop();
  }
});

test('does not narrow replacement candidates to the unisex gender bucket', async () => {
  let observedGender = 'not-called';
  const executeTool = createHarness({
    history: [{ role: 'model', productIds: ['shirt-black', 'jeans'] }],
    onGetProducts: (filters) => { observedGender = filters.gender; },
  });
  const result = await executeTool('replace_outfit_item', {
    replaceType: 'top',
    category: 'áo sơ mi',
    color: 'trắng',
    budget: 1000000,
    gender: 'unisex',
  });
  assert.equal(result.replaced, true);
  assert.equal(observedGender, undefined);
});
