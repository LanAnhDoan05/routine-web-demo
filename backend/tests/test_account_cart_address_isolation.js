const http = require('http');
const app = require('../app');
const prisma = require('../src/config/prisma');

const TEST_PORT = 5007;
const server = http.createServer(app);

server.listen(TEST_PORT, async () => {
  console.log(`Isolation test server running on port ${TEST_PORT}\n`);

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
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
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

  const phone1 = '0971' + Math.floor(100000 + Math.random() * 900000);
  const email1 = `user_iso_1_${Date.now()}@routine.vn`;

  const phone2 = '0972' + Math.floor(100000 + Math.random() * 900000);
  const email2 = `user_iso_2_${Date.now()}@routine.vn`;

  try {
    // 1. Create User 1
    const reg1 = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'User Một',
        phoneNumber: phone1,
        email: email1,
        password: 'Password@123',
        gender: 'men',
      },
    });
    const token1 = reg1.body.data.token;
    assert(Boolean(token1), 'User 1 registered successfully');

    // 2. User 1 adds item to cart
    const add1 = await request('/api/v1/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: {
        productId: 'p001',
        size: 'L',
        color: 'Trắng',
        quantity: 2,
        name: 'Áo Thun Nam Basic',
        price: 350000,
      },
    });
    assert(add1.status === 201, 'User 1 added item to cart');

    // 3. User 1 adds an address
    const addr1 = await request('/api/v1/users/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: {
        receiverName: 'User Một',
        phone: phone1,
        street: '123 Đường Số 1',
        ward: 'Phường 1',
        district: 'Quận 1',
        city: 'Hồ Chí Minh',
        isDefault: true,
      },
    });
    assert(addr1.status === 201, 'User 1 saved an address');

    // 4. Create User 2
    const reg2 = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'User Hai',
        phoneNumber: phone2,
        email: email2,
        password: 'Password@123',
        gender: 'women',
      },
    });
    const token2 = reg2.body.data.token;
    assert(Boolean(token2), 'User 2 registered successfully');

    // 5. Check User 2 cart: MUST BE EMPTY
    const cart2 = await request('/api/v1/cart', {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert(
      cart2.status === 200 && (!cart2.body.data.items || cart2.body.data.items.length === 0),
      'User 2 initial cart is empty (no leakage from User 1)'
    );

    // 6. Check User 2 addresses: MUST BE EMPTY
    const addrs2 = await request('/api/v1/users/addresses', {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert(
      addrs2.status === 200 && (!addrs2.body.data || addrs2.body.data.length === 0),
      'User 2 addresses list is empty (no leakage from User 1)'
    );

    // 7. User 2 adds their own item
    await request('/api/v1/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
      body: {
        productId: 'p002',
        size: 'M',
        color: 'Đen',
        quantity: 1,
        name: 'Đầm Nữ Công Sở',
        price: 650000,
      },
    });

    // 8. Re-check User 1 cart: STILL HAS 1 item with quantity 2
    const cart1Check = await request('/api/v1/cart', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert(
      cart1Check.status === 200 &&
      cart1Check.body.data.items.length === 1 &&
      cart1Check.body.data.items[0].productId === 'p001',
      'User 1 cart retains only User 1 items'
    );

    // 9. Re-check User 2 cart: STILL HAS only User 2 item
    const cart2Check = await request('/api/v1/cart', {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert(
      cart2Check.status === 200 &&
      cart2Check.body.data.items.length === 1 &&
      cart2Check.body.data.items[0].productId === 'p002',
      'User 2 cart retains only User 2 items'
    );

    // Cleanup test users
    await prisma.cart.deleteMany({
      where: { user: { email: { in: [email1, email2] } } },
    });
    await prisma.address.deleteMany({
      where: { user: { email: { in: [email1, email2] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [email1, email2] } },
    });
    console.log('\nCleaned up test data successfully');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    console.log(`\nResults: ${passed}/${total} tests passed.`);
    server.close();
    await prisma.$disconnect();
    process.exit(passed === total ? 0 : 1);
  }
});
