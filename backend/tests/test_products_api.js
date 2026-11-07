const http = require('http');
const app = require('../app');

const server = http.createServer(app);
const TEST_PORT = 5002;

server.listen(TEST_PORT, async () => {
  console.log(`Product & Category test server running on port ${TEST_PORT}`);

  async function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: TEST_PORT,
          path,
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  }

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✔ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✖ [FAIL] ${testName}`);
    }
  }

  try {
    // 1. GET /api/v1/categories
    const catAll = await request('/api/v1/categories');
    assert(
      catAll.status === 200 &&
        catAll.body.success === true &&
        Array.isArray(catAll.body.data.quickCategories) &&
        Array.isArray(catAll.body.data.megaMenuCategories),
      'GET /api/v1/categories returns category bundles'
    );

    // 2. GET /api/v1/categories?type=quick
    const catQuick = await request('/api/v1/categories?type=quick');
    assert(
      catQuick.status === 200 && Array.isArray(catQuick.body.data) && catQuick.body.data.length > 0,
      'GET /api/v1/categories?type=quick returns quick categories array'
    );

    // 3. GET /api/v1/categories/men
    const catMen = await request('/api/v1/categories/men');
    assert(
      catMen.status === 200 && catMen.body.data.slug === 'men',
      'GET /api/v1/categories/men returns Men category detail'
    );

    // 4. GET /api/v1/categories/styles
    const styles = await request('/api/v1/categories/styles');
    assert(
      styles.status === 200 && Array.isArray(styles.body.data) && styles.body.data.length >= 6,
      'GET /api/v1/categories/styles returns styles list'
    );

    // 5. GET /api/v1/categories/styles/minimal
    const styleMinimal = await request('/api/v1/categories/styles/minimal');
    assert(
      styleMinimal.status === 200 && styleMinimal.body.data.slug === 'minimal',
      'GET /api/v1/categories/styles/minimal returns Minimal style detail'
    );

    // 6. GET /api/v1/products (pagination & items)
    const prodList = await request('/api/v1/products?limit=10&page=1');
    assert(
      prodList.status === 200 &&
        prodList.body.data.items.length === 10 &&
        prodList.body.data.pagination.total === 28,
      'GET /api/v1/products returns paginated products'
    );

    // 7. GET /api/v1/products?category=tops&gender=men
    const filteredTops = await request('/api/v1/products?category=tops&gender=men');
    const allMatch = filteredTops.body.data.items.every(
      (p) => p.category === 'tops' && p.gender === 'men'
    );
    assert(
      filteredTops.status === 200 && filteredTops.body.data.items.length > 0 && allMatch,
      'GET /api/v1/products filters correctly by category and gender'
    );

    // 8. GET /api/v1/products?sort=price-asc
    const sortedAsc = await request('/api/v1/products?sort=price-asc');
    const isSorted = sortedAsc.body.data.items.every((p, i, arr) => {
      if (i === 0) return true;
      return p.price >= arr[i - 1].price;
    });
    assert(
      sortedAsc.status === 200 && isSorted,
      'GET /api/v1/products?sort=price-asc sorts products ascending by price'
    );

    // 9. GET /api/v1/products?q=cotton
    const searchRes = await request('/api/v1/products?q=cotton');
    assert(
      searchRes.status === 200 && searchRes.body.data.items.length > 0,
      'GET /api/v1/products?q=cotton searches products by text'
    );

    // 10. GET /api/v1/products/featured
    const featured = await request('/api/v1/products/featured?limit=5');
    const allBestSeller = featured.body.data.every((p) => p.badge === 'BEST SELLER');
    assert(
      featured.status === 200 && featured.body.data.length === 5 && allBestSeller,
      'GET /api/v1/products/featured returns Best Seller products'
    );

    // 11. GET /api/v1/products/trending?gender=women
    const trendingWomen = await request('/api/v1/products/trending?gender=women');
    const allWomen = trendingWomen.body.data.every((p) => p.gender === 'women');
    assert(
      trendingWomen.status === 200 && trendingWomen.body.data.length > 0 && allWomen,
      'GET /api/v1/products/trending?gender=women returns trending products for women'
    );

    // 12. GET /api/v1/products/p001
    const p1 = await request('/api/v1/products/p001');
    assert(
      p1.status === 200 && p1.body.data.id === 'p001' && p1.body.data.name === 'Essential Cotton T-Shirt',
      'GET /api/v1/products/p001 returns product detail'
    );

    // 13. GET /api/v1/products/p001/related
    const related = await request('/api/v1/products/p001/related?limit=3');
    assert(
      related.status === 200 && Array.isArray(related.body.data) && related.body.data.length === 3,
      'GET /api/v1/products/p001/related returns related products'
    );

    // 14. GET /api/v1/products/invalid-id (404)
    const pNotFound = await request('/api/v1/products/invalid-id-999');
    assert(
      pNotFound.status === 404 && pNotFound.body.success === false,
      'GET /api/v1/products/invalid-id returns 404 Not Found'
    );

    console.log(`\nResults: ${passed}/${total} tests passed.`);
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
  }
});
