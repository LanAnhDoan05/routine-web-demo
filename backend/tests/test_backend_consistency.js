const http = require('http');
const app = require('../app');

const server = http.createServer(app);
const TEST_PORT = 5005;

server.listen(TEST_PORT, async () => {
  console.log(`Backend consistency test server running on port ${TEST_PORT}\n`);

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
    // 1. Health check
    const health = await request('/api/v1/health');
    assert(health.status === 200 && health.body.success === true, 'Health check operational');

    // 2. Outfits: GET /api/v1/outfits
    const outfitList = await request('/api/v1/outfits?limit=5');
    assert(
      outfitList.status === 200 &&
        outfitList.body.data.items.length === 5 &&
        outfitList.body.data.items[0].products.length > 0,
      'GET /api/v1/outfits returns hydrated outfits with products and total'
    );

    // 3. Outfits: GET /api/v1/outfits/featured
    const outfitFeat = await request('/api/v1/outfits/featured?limit=3');
    assert(
      outfitFeat.status === 200 && outfitFeat.body.data.length === 3,
      'GET /api/v1/outfits/featured returns featured outfits'
    );

    // 4. Outfits: GET /api/v1/outfits/o001
    const outfit1 = await request('/api/v1/outfits/o001');
    assert(
      outfit1.status === 200 &&
        outfit1.body.data.id === 'o001' &&
        outfit1.body.data.total > 0 &&
        Array.isArray(outfit1.body.data.products),
      'GET /api/v1/outfits/o001 returns detail with products list and total price'
    );

    // 5. Outfits: GET /api/v1/outfits/o001/related
    const outfitRel = await request('/api/v1/outfits/o001/related?limit=2');
    assert(
      outfitRel.status === 200 && Array.isArray(outfitRel.body.data),
      'GET /api/v1/outfits/o001/related returns related outfits'
    );

    // 6. AI Stylist: POST /api/v1/ai/stylist
    const aiRes = await request('/api/v1/ai/stylist', {
      method: 'POST',
      body: {
        occasion: 'Đi làm',
        style: 'Smart Casual',
        budget: '500K – 1M',
        gender: 'men',
      },
    });
    assert(
      aiRes.status === 200 &&
        aiRes.body.success === true &&
        aiRes.body.data.outfit &&
        Array.isArray(aiRes.body.data.products) &&
        typeof aiRes.body.data.message === 'string',
      'POST /api/v1/ai/stylist returns fashion stylist recommendation matching frontend structure'
    );

    // 7. AI Suggest: Yêu cầu auth token
    const aiSuggestNoAuth = await request('/api/v1/ai/suggest', {
      method: 'POST',
      body: { goal: 'Tìm outfit đi tiệc tối' },
    });
    assert(
      aiSuggestNoAuth.status === 401,
      'POST /api/v1/ai/suggest requires authentication token'
    );

    // 8. Auth: Send OTP
    const otpRes = await request('/api/v1/auth/send-otp', {
      method: 'POST',
      body: { phone: '0901234567' },
    });
    assert(
      otpRes.status === 200 && otpRes.body.success === true,
      'POST /api/v1/auth/send-otp sends OTP successfully'
    );

    // 9. Auth: Verify OTP
    const verifyRes = await request('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phone: '0901234567', otp: '123456' },
    });
    assert(
      verifyRes.status === 200 && verifyRes.body.data.verified === true,
      'POST /api/v1/auth/verify-otp verifies valid OTP'
    );

    // 10. Auth: Reset Password
    const resetRes = await request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: { phone: '0901234567', password: 'newpassword123' },
    });
    assert(
      resetRes.status === 200 && resetRes.body.success === true,
      'POST /api/v1/auth/reset-password resets password'
    );

    // 11. Orders: POST /api/v1/orders (Create Order)
    const consistencySession = 'session-consistency-test';
    const orderCreate = await request('/api/v1/orders', {
      method: 'POST',
      headers: { 'x-session-id': consistencySession },
      body: {
        items: [
          {
            productId: 'p001',
            name: 'Essential Cotton T-Shirt',
            image: '/images/products/product-01.jpg',
            color: 'Black',
            size: 'L',
            quantity: 2,
            price: 299000,
          },
        ],
        shippingAddress: {
          name: 'Trần Văn B',
          phone: '0901234567',
          address: '456 Hai Bà Trưng',
          city: 'Hà Nội',
          district: 'Hoàn Kiếm',
          ward: 'Phường Tràng Tiền',
        },
        shippingMethod: 'standard',
        paymentMethod: 'cod',
      },
    });
    assert(
      orderCreate.status === 201 &&
        orderCreate.body.data.id.startsWith('ORD-') &&
        orderCreate.body.data.timeline.length > 0,
      'POST /api/v1/orders creates order with timeline and unique ID'
    );

    const createdOrderId = orderCreate.body.data.id;

    // 12. Orders: GET /api/v1/orders
    const orderList = await request('/api/v1/orders', {
      headers: { 'x-session-id': consistencySession },
    });
    assert(
      orderList.status === 200 &&
        Array.isArray(orderList.body.data.items) &&
        orderList.body.data.items.length > 0,
      'GET /api/v1/orders retrieves list of orders'
    );

    // 13. Orders: GET /api/v1/orders/:id
    const orderDetail = await request(`/api/v1/orders/${createdOrderId}`);
    assert(
      orderDetail.status === 200 &&
        orderDetail.body.data.id === createdOrderId &&
        orderDetail.body.data.status === 'confirmed',
      'GET /api/v1/orders/:id retrieves order detail'
    );

    // 14. Orders: PATCH /api/v1/orders/:id/cancel
    const orderCancel = await request(`/api/v1/orders/${createdOrderId}/cancel`, {
      method: 'PATCH',
    });
    assert(
      orderCancel.status === 200 && orderCancel.body.data.status === 'cancelled',
      'PATCH /api/v1/orders/:id/cancel cancels order successfully'
    );

    // 15. Orders: POST /api/v1/orders/:id/reorder
    const reorderRes = await request(`/api/v1/orders/${createdOrderId}/reorder`, {
      method: 'POST',
      headers: { 'x-session-id': consistencySession },
    });
    assert(
      reorderRes.status === 200 &&
        reorderRes.body.data.items.length > 0 &&
        reorderRes.body.data.items.some((i) => i.productId === 'p001'),
      'POST /api/v1/orders/:id/reorder adds items back to cart'
    );

    console.log(`\nConsistency Test Results: ${passed}/${total} tests passed.`);
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
  }
});
