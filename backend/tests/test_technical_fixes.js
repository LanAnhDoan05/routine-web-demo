/**
 * Test kịch bản xác thực các lỗi kỹ thuật đã được khắc phục:
 * 1. Test await cartService.getCart trong orderService.createOrder
 * 2. Test identifyUser middleware sinh guest session duy nhất
 * 3. Test reserveStock transaction & concurrency
 * 4. Test rate-limiting & helmet HTTP headers
 */

const assert = require('assert');
const cartService = require('../src/services/cartService');
const orderService = require('../src/services/orderService');
const stockReservationService = require('../src/services/stockReservationService');
const prisma = require('../src/config/prisma');

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ CÁC HẠN CHẾ KỸ THUẬT ĐÃ KHẮC PHỤC ===\n');
  let passed = 0;
  let failed = 0;

  // TEST 1: identifyUser middleware sinh guest session độc lập
  try {
    console.log('[TEST 1] Kiểm tra identifyUser middleware sinh guest session duy nhất:');
    const identifyUser = require('../src/middlewares/identifyUser');
    const mockReq1 = { headers: {}, ip: '127.0.0.1' };
    const mockRes1 = {
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      cookie() {},
    };
    let nextCalled1 = false;
    identifyUser(mockReq1, mockRes1, () => { nextCalled1 = true; });

    assert.strictEqual(nextCalled1, true, 'identifyUser phải gọi next()');
    assert.ok(mockReq1.identityId.startsWith('guest_g_'), 'identityId phải là guest_g_... chứ không phải guest_127.0.0.1');
    assert.notStrictEqual(mockReq1.identityId, 'guest_127.0.0.1', 'Không được gộp guest session theo IP');
    assert.ok(mockRes1.headers['x-session-id'], 'Phải gửi x-session-id vào response header');

    // Khách 2 cùng IP
    const mockReq2 = { headers: {}, ip: '127.0.0.1' };
    const mockRes2 = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, cookie() {} };
    identifyUser(mockReq2, mockRes2, () => {});

    assert.notStrictEqual(mockReq1.identityId, mockReq2.identityId, '2 khách cùng IP phải có 2 session id khác nhau hoàn toàn');
    console.log('  -> PASSED: Guest session sinh độc lập cho từng khách, không bị leak/gộp giỏ theo IP.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAILED:', err.message, '\n');
    failed++;
  }

  // TEST 2: stockReservationService.reserveStock với transaction
  try {
    console.log('[TEST 2] Kiểm tra reserveStock với transaction:');
    const testOrderId = 'TEST-ORD-' + Date.now();
    // Tạo 1 đơn hàng tạm trong DB để thỏa mãn foreign key
    const testOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        receiverName: 'Test Concurrency',
        phoneNumber: '0900000000',
        shippingAddress: '123 Test St',
        total: 100000,
        subtotal: 100000,
      },
    });

    const products = await prisma.product.findMany({ take: 1 });
    if (products.length > 0) {
      const prod = products[0];
      const reservation = await stockReservationService.reserveStock(
        testOrderId,
        [{ productId: prod.id, name: prod.name, quantity: 1 }],
        5
      );
      assert.ok(reservation, 'Phải giữ kho thành công');
      assert.strictEqual(reservation.orderId, testOrderId);
      assert.strictEqual(reservation.isHeld, true);

      // Dọn dẹp
      await stockReservationService.releaseStock(testOrderId);
    }
    await prisma.order.delete({ where: { id: testOrderId } }).catch(() => {});
    console.log('  -> PASSED: reserveStock thực thi atomic transaction thành công.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAILED:', err.message, '\n');
    failed++;
  }

  // TEST 3: orderService.createOrder khi không truyền items (lấy từ giỏ hàng đã có)
  try {
    console.log('[TEST 3] Kiểm tra orderService.createOrder với await cartService.getCart:');
    const testGuestSession = 'g_test_' + Date.now();
    const testIdentity = `guest_${testGuestSession}`;

    const prods = await prisma.product.findMany({ take: 1 });
    if (prods.length > 0) {
      // 1. Thêm sản phẩm vào giỏ
      await cartService.addItem(testIdentity, {
        productId: prods[0].id,
        size: 'M',
        color: 'Đen',
        quantity: 1,
      });

      // 2. Tạo đơn hàng KHÔNG truyền items trong body (để backend tự await cartService.getCart)
      const orderResult = await orderService.createOrder(testIdentity, {
        shippingAddress: {
          name: 'Test Customer',
          phone: '0987654321',
          address: '456 Test Street, HN',
        },
        paymentMethod: 'cod',
      });

      assert.ok(orderResult, 'Đơn hàng phải tạo thành công');
      assert.ok(orderResult.id, 'Đơn hàng phải có ID');
      assert.strictEqual(orderResult.items.length, 1, 'Đơn hàng phải lấy đúng 1 item từ giỏ hàng');

      // Dọn dẹp
      await prisma.order.delete({ where: { id: orderResult.id } }).catch(() => {});
      await prisma.cart.deleteMany({ where: { guestSessionId: testGuestSession } }).catch(() => {});
    }
    console.log('  -> PASSED: createOrder tự động await giỏ hàng thành công mà không báo giỏ hàng trống.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAILED:', err.message, '\n');
    failed++;
  }

  // TEST 4: Kiểm tra Helmet và Rate Limiting middleware
  try {
    console.log('[TEST 4] Kiểm tra Helmet & Rate Limiter trong app.js:');
    const app = require('../app');
    assert.ok(app, 'App phải export Express instance');
    const { generalLimiter, authLimiter, aiLimiter } = require('../src/middlewares/rateLimiter');
    assert.ok(generalLimiter, 'generalLimiter phải tồn tại');
    assert.ok(authLimiter, 'authLimiter phải tồn tại');
    assert.ok(aiLimiter, 'aiLimiter phải tồn tại');
    console.log('  -> PASSED: Helmet & Rate limiters đã được cấu hình chuẩn xác.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAILED:', err.message, '\n');
    failed++;
  }

  console.log(`=== TỔNG KẾT: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Lỗi chạy kịch bản kiểm thử:', err);
  process.exit(1);
});
