const http = require('http');
const app = require('../app');

const PORT = 5003;
let server;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURI(options.path);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        ...options,
        path: encodedPath,
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
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Cart & Wishlist test server running on port', PORT);
  let passed = 0;
  let total = 0;

  const testSession = 'test_guest_session_123';
  const testUserAuth = 'Bearer test_user_token_abc';

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✔ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`✘ [FAIL] ${message}`);
    }
  }

  try {
    // 1. GET /api/v1/cart - initial empty cart
    {
      const res = await request({
        path: '/api/v1/cart',
        method: 'GET',
        headers: { 'x-session-id': testSession },
      });
      assert(
        res.status === 200 && res.body.data.itemCount === 0 && res.body.data.total === 0,
        'GET /api/v1/cart returns initial empty cart'
      );
    }

    // 2. POST /api/v1/cart/items - add product p001
    let p001LineId = '';
    {
      const res = await request(
        {
          path: '/api/v1/cart/items',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        { productId: 'p001', size: 'L', color: 'Trắng', quantity: 2 }
      );
      assert(
        res.status === 201 &&
          res.body.data.itemCount === 2 &&
          res.body.data.items[0].productId === 'p001' &&
          res.body.data.items[0].lineId === 'p001__L__Trắng',
        'POST /api/v1/cart/items adds product with size and color'
      );
      p001LineId = res.body.data.items[0].lineId;
    }

    // 3. POST /api/v1/cart/items - add same item again to test quantity accumulation
    {
      const res = await request(
        {
          path: '/api/v1/cart/items',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        { productId: 'p001', size: 'L', color: 'Trắng', quantity: 1 }
      );
      assert(
        res.status === 201 &&
          res.body.data.itemCount === 3 &&
          res.body.data.items[0].quantity === 3,
        'POST /api/v1/cart/items accumulates quantity for duplicate item'
      );
    }

    // 4. POST /api/v1/cart/items/bulk - add combo outfit items (p002, p003)
    {
      const res = await request(
        {
          path: '/api/v1/cart/items/bulk',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        {
          items: [
            { productId: 'p002', size: 'M', color: 'Đen', quantity: 1 },
            { productId: 'p003', size: 'XL', color: 'Xanh Navy', quantity: 1 },
          ],
        }
      );
      assert(
        res.status === 201 &&
          res.body.data.items.length === 3 &&
          res.body.data.itemCount === 5,
        'POST /api/v1/cart/items/bulk adds multiple outfit products'
      );
    }

    // 5. PATCH /api/v1/cart/items/:lineId - update quantity
    {
      const res = await request(
        {
          path: `/api/v1/cart/items/${p001LineId}`,
          method: 'PATCH',
          headers: { 'x-session-id': testSession },
        },
        { quantity: 1 }
      );
      const target = res.body.data.items.find((i) => i.lineId === p001LineId);
      assert(
        res.status === 200 && target && target.quantity === 1 && res.body.data.itemCount === 3,
        'PATCH /api/v1/cart/items/:lineId updates item quantity'
      );
    }

    // 6. POST /api/v1/cart/apply-coupon - apply discount coupon
    {
      const res = await request(
        {
          path: '/api/v1/cart/apply-coupon',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        { code: 'ROUTINE10' }
      );
      assert(
        res.status === 200 &&
          res.body.data.appliedCoupon &&
          res.body.data.appliedCoupon.code === 'ROUTINE10' &&
          res.body.data.discount > 0,
        'POST /api/v1/cart/apply-coupon applies ROUTINE10 coupon'
      );
    }

    // 7. DELETE /api/v1/cart/coupon - remove coupon
    {
      const res = await request({
        path: '/api/v1/cart/coupon',
        method: 'DELETE',
        headers: { 'x-session-id': testSession },
      });
      assert(
        res.status === 200 &&
          res.body.data.appliedCoupon === null &&
          res.body.data.discount === 0,
        'DELETE /api/v1/cart/coupon successfully removes coupon'
      );
    }

    // 8. DELETE /api/v1/cart/items/:lineId - remove one item
    {
      const res = await request({
        path: `/api/v1/cart/items/${p001LineId}`,
        method: 'DELETE',
        headers: { 'x-session-id': testSession },
      });
      const exists = res.body.data.items.some((i) => i.lineId === p001LineId);
      assert(
        res.status === 200 && !exists && res.body.data.items.length === 2,
        'DELETE /api/v1/cart/items/:lineId removes target item'
      );
    }

    // 9. DELETE /api/v1/cart - clear entire cart
    {
      const res = await request({
        path: '/api/v1/cart',
        method: 'DELETE',
        headers: { 'x-session-id': testSession },
      });
      assert(
        res.status === 200 && res.body.data.items.length === 0 && res.body.data.total === 0,
        'DELETE /api/v1/cart clears cart completely'
      );
    }

    // 10. POST /api/v1/cart/merge - merge guest cart to user cart
    {
      const guestSess = 'guest_temp_999';
      const userHeader = 'guest_logged_in_user';
      // Add item to guest session
      await request(
        {
          path: '/api/v1/cart/items',
          method: 'POST',
          headers: { 'x-session-id': guestSess },
        },
        { productId: 'p004', quantity: 2 }
      );

      // Merge into user cart
      const res = await request(
        {
          path: '/api/v1/cart/merge',
          method: 'POST',
          headers: { 'x-session-id': userHeader },
        },
        { guestSessionId: guestSess }
      );

      assert(
        res.status === 200 &&
          res.body.data.items.some((i) => i.productId === 'p004') &&
          res.body.data.itemCount === 2,
        'POST /api/v1/cart/merge transfers guest items to user cart'
      );
    }

    // 11. POST /api/v1/wishlist/toggle - toggle product p001 on
    {
      const res = await request(
        {
          path: '/api/v1/wishlist/toggle',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        { productId: 'p001' }
      );
      assert(
        res.status === 200 && res.body.data.inWishlist === true && res.body.data.count === 1,
        'POST /api/v1/wishlist/toggle adds product to wishlist'
      );
    }

    // 12. GET /api/v1/wishlist/check/:productId - check wishlist status
    {
      const res = await request({
        path: '/api/v1/wishlist/check/p001',
        method: 'GET',
        headers: { 'x-session-id': testSession },
      });
      assert(
        res.status === 200 && res.body.data.inWishlist === true,
        'GET /api/v1/wishlist/check/p001 confirms item is in wishlist'
      );
    }

    // 13. GET /api/v1/wishlist - retrieve hydrated wishlist
    {
      const res = await request({
        path: '/api/v1/wishlist',
        method: 'GET',
        headers: { 'x-session-id': testSession },
      });
      assert(
        res.status === 200 &&
          res.body.data.count === 1 &&
          res.body.data.items[0].id === 'p001' &&
          res.body.data.items[0].name &&
          res.body.data.items[0].price,
        'GET /api/v1/wishlist returns full hydrated product info'
      );
    }

    // 14. POST /api/v1/wishlist/toggle - toggle product p001 off
    {
      const res = await request(
        {
          path: '/api/v1/wishlist/toggle',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        { productId: 'p001' }
      );
      assert(
        res.status === 200 && res.body.data.inWishlist === false && res.body.data.count === 0,
        'POST /api/v1/wishlist/toggle removes product when toggled again'
      );
    }

    // 15. POST /api/v1/wishlist/items & DELETE /api/v1/wishlist/items/:id
    {
      await request(
        {
          path: '/api/v1/wishlist/items',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        { productId: 'p005' }
      );
      await request(
        {
          path: '/api/v1/wishlist/items',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        { productId: 'p006' }
      );

      const delRes = await request({
        path: '/api/v1/wishlist/items/p005',
        method: 'DELETE',
        headers: { 'x-session-id': testSession },
      });

      assert(
        delRes.status === 200 &&
          delRes.body.data.count === 1 &&
          delRes.body.data.items[0].id === 'p006',
        'DELETE /api/v1/wishlist/items/:id removes specific product'
      );
    }

    // 16. DELETE /api/v1/wishlist - clear all wishlist items
    {
      const res = await request({
        path: '/api/v1/wishlist',
        method: 'DELETE',
        headers: { 'x-session-id': testSession },
      });
      assert(
        res.status === 200 && res.body.data.count === 0 && res.body.data.items.length === 0,
        'DELETE /api/v1/wishlist clears all items'
      );
    }

    // 17. Error validation test: invalid productId
    {
      const res = await request(
        {
          path: '/api/v1/cart/items',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        { productId: 'non_existent_product_999', quantity: 1 }
      );
      assert(
        res.status === 404,
        'POST /api/v1/cart/items with invalid productId returns 404'
      );
    }

    // 18. Error validation test: invalid coupon code
    {
      const res = await request(
        {
          path: '/api/v1/cart/apply-coupon',
          method: 'POST',
          headers: { 'x-session-id': testSession },
        },
        { code: 'INVALID_COUPON_XYZ' }
      );
      assert(
        res.status === 400,
        'POST /api/v1/cart/apply-coupon with invalid coupon returns 400'
      );
    }

    console.log(`\nResults: ${passed}/${total} tests passed.\n`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    process.exit(passed === total ? 0 : 1);
  }
}

server = app.listen(PORT, () => {
  runTests();
});
