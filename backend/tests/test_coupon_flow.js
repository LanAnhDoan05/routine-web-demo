const prisma = require('../src/config/prisma');
const couponService = require('../src/services/couponService');
const orderService = require('../src/services/orderService');

async function runCouponTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG MÃ GIẢM GIÁ (COUPON FLOW) ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Test validateCoupon với mã ROUTINE10 đủ điều kiện
  try {
    const res1 = await couponService.validateCoupon('ROUTINE10', 500000);
    assert(res1.valid === true, 'ROUTINE10 hợp lệ cho đơn 500.000đ');
    assert(res1.discountAmount === 50000, `ROUTINE10 giảm đúng 10% (50.000đ): nhận được ${res1.discountAmount}`);
  } catch (err) {
    assert(false, `ROUTINE10 lỗi: ${err.message}`);
  }

  // 2. Test validateCoupon với mã ROUTINE10 chưa đủ đơn tối thiểu (minOrderValue: 300.000đ)
  try {
    await couponService.validateCoupon('ROUTINE10', 100000);
    assert(false, 'ROUTINE10 phải báo lỗi khi chưa đạt đơn tối thiểu');
  } catch (err) {
    assert(err.message.includes('chưa đạt giá trị tối thiểu'), `Bắt đúng lỗi đơn tối thiểu: "${err.message}"`);
  }

  // 3. Test validateCoupon với mã FLASH50 (giảm cố định 50.000đ cho đơn từ 400.000đ)
  try {
    const res3 = await couponService.validateCoupon('FLASH50', 450000);
    assert(res3.valid === true, 'FLASH50 hợp lệ cho đơn 450.000đ');
    assert(res3.discountAmount === 50000, `FLASH50 giảm cố định 50.000đ: nhận được ${res3.discountAmount}`);
  } catch (err) {
    assert(false, `FLASH50 lỗi: ${err.message}`);
  }

  // 4. Test validateCoupon với mã không tồn tại
  try {
    await couponService.validateCoupon('KHONGTONTAI999', 500000);
    assert(false, 'Mã không tồn tại phải bị từ chối');
  } catch (err) {
    assert(err.message.includes('không hợp lệ hoặc đã hết hiệu lực'), `Bắt đúng lỗi mã không tồn tại: "${err.message}"`);
  }

  // 5. Test createOrder lưu vết appliedCoupon vào cơ sở dữ liệu
  let createdOrderId = null;
  try {
    const testOrderInput = {
      items: [
        {
          productId: 'p001',
          name: 'Áo Thun Cotton Compact',
          price: 250000,
          quantity: 2,
          size: 'L',
          color: 'Trắng',
        },
      ],
      shippingAddress: {
        receiverName: 'Người Kiểm Thử Coupon',
        phoneNumber: '0987654321',
        street: '123 Đường Test Coupon',
      },
      paymentMethod: 'cod',
      subtotal: 500000,
      appliedCoupon: 'ROUTINE10',
    };

    const order = await orderService.createOrder('guest_test_coupon_session', testOrderInput);
    createdOrderId = order.id;

    assert(order.appliedCoupon === 'ROUTINE10', `order.appliedCoupon trả về đúng "ROUTINE10": ${order.appliedCoupon}`);
    assert(order.discount === 50000, `order.discount được tính đúng 50.000đ: ${order.discount}`);
    assert(order.total === 450000, `order.total đúng sau khi trừ voucher: ${order.total}`);

    // Kiểm tra trực tiếp trong MySQL Prisma
    const dbOrder = await prisma.order.findUnique({
      where: { id: createdOrderId },
      select: { id: true, appliedCoupon: true, discount: true, total: true },
    });

    assert(dbOrder.appliedCoupon === 'ROUTINE10', `MySQL Database lưu đúng appliedCoupon = "ROUTINE10": ${dbOrder.appliedCoupon}`);
  } catch (err) {
    assert(false, `Lỗi tạo đơn hàng có coupon: ${err.message}`);
  } finally {
    if (createdOrderId) {
      // Dọn dẹp đơn test
      try {
        await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.stockReservation.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.order.delete({ where: { id: createdOrderId } });
      } catch (cleanupErr) {
        console.warn('Lỗi dọn dẹp đơn test:', cleanupErr.message);
      }
    }
  }

  console.log(`\n=== KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runCouponTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
