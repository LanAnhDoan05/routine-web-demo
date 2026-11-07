const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../app');

const server = http.createServer(app);
const TEST_PORT = 5008;
const JWT_SECRET = process.env.JWT_SECRET || 'routine_web_jwt_secret_key_change_me';

const customerToken = jwt.sign(
  { userId: 'usr-customer-001', fullName: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', role: 'CUSTOMER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { userId: 'c0d4fbad-b038-11f1-9fbc-005056c00001', fullName: 'Admin Routine', email: 'admin_new@routine.vn', role: 'ADMIN' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

server.listen(TEST_PORT, async () => {
  console.log(`Package B test server running on port ${TEST_PORT}\n`);

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

  try {
    // 1. Lấy danh sách đánh giá sản phẩm p001
    const revList = await request('/api/v1/products/p001/reviews');
    assert(
      revList.status === 200 &&
        Array.isArray(revList.body.data.items) &&
        revList.body.data.summary.averageRating > 0 &&
        revList.body.data.summary.ratingBreakdown,
      'GET /api/v1/products/p001/reviews returns reviews list, average rating and breakdown'
    );

    // 2. Người dùng đăng đánh giá mới
    const createRev = await request('/api/v1/products/p001/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        rating: 5,
        comment: 'Sản phẩm tuyệt vời ngoài mong đợi, chất vải mịn không bị xù lông sau khi giặt!',
      },
    });
    assert(
      createRev.status === 201 &&
        createRev.body.data.review.rating === 5 &&
        createRev.body.data.productStats.reviewCount > 0,
      'POST /api/v1/products/p001/reviews adds new review and recalculates product rating'
    );

    const createdRevId = createRev.body.data.review.id;

    // 3. Admin xóa đánh giá
    const delRev = await request(`/api/v1/reviews/${createdRevId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      delRev.status === 200 && delRev.body.success === true,
      'DELETE /api/v1/reviews/:id deletes review with ADMIN token'
    );

    // 4. Lấy danh sách coupons công khai
    const couponList = await request('/api/v1/coupons');
    assert(
      couponList.status === 200 &&
        Array.isArray(couponList.body.data) &&
        couponList.body.data.some((c) => c.code === 'ROUTINE10'),
      'GET /api/v1/coupons returns active coupons'
    );

    // 5. Kiểm tra tính hợp lệ của mã giảm giá (validate)
    const validateRes = await request('/api/v1/coupons/validate', {
      method: 'POST',
      body: {
        code: 'ROUTINE10',
        subtotal: 500000,
      },
    });
    assert(
      validateRes.status === 200 &&
        validateRes.body.data.valid === true &&
        validateRes.body.data.discountAmount === 50000,
      'POST /api/v1/coupons/validate calculates correct discount'
    );

    // 6. Admin tạo mã giảm giá mới
    const testCouponCode = 'FLASH50_PKG_B';
    const createCpn = await request('/api/v1/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        code: testCouponCode,
        type: 'fixed',
        value: 50000,
        minOrderValue: 200000,
        description: 'Mã Flash Sale giảm 50k từ Admin',
      },
    });
    assert(
      createCpn.status === 201 && createCpn.body.data.code === testCouponCode,
      'POST /api/v1/coupons creates new coupon with ADMIN token'
    );

    // 7. Thêm hàng vào giỏ và áp dụng mã vừa tạo
    const addCart = await request('/api/v1/cart/items', {
      method: 'POST',
      headers: { 'x-session-id': 'session-pkg-b' },
      body: { productId: 'p001', quantity: 1 },
    });
    assert(addCart.status === 201, 'POST /api/v1/cart/items adds item');

    const applyCpn = await request('/api/v1/cart/apply-coupon', {
      method: 'POST',
      headers: { 'x-session-id': 'session-pkg-b' },
      body: { code: testCouponCode },
    });
    assert(
      applyCpn.status === 200 &&
        applyCpn.body.data.appliedCoupon.code === testCouponCode &&
        applyCpn.body.data.discount === 50000,
      'POST /api/v1/cart/apply-coupon applies newly created Admin coupon dynamically in cart'
    );

    // 8. Admin cập nhật mã giảm giá
    const updateCpn = await request(`/api/v1/coupons/${testCouponCode}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        value: 60000,
        description: 'Mã Flash Sale giảm 60k đã cập nhật',
      },
    });
    assert(
      updateCpn.status === 200 && updateCpn.body.data.value === 60000,
      'PUT /api/v1/coupons/:code updates coupon value'
    );

    // 9. Admin xóa mã giảm giá
    const delCpn = await request(`/api/v1/coupons/${testCouponCode}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delCpn.status === 200 && delCpn.body.data.deleted === true, 'DELETE /api/v1/coupons/:code deletes coupon');

    console.log(`\nPackage B Test Results: ${passed}/${total} tests passed.`);
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
  }
});
