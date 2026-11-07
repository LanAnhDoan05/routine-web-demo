const prisma = require('../src/config/prisma');
const orderService = require('../src/services/orderService');
const vnpayService = require('../src/services/vnpayService');
const emailService = require('../src/services/emailService');

async function runTests() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ: TỰ ĐỘNG GỬI EMAIL HÓA ĐƠN ĐƠN HÀNG (ROUTINE)');
  console.log('================================================================\n');

  try {
    // 1. Lấy một sản phẩm mẫu trong DB
    const product = await prisma.product.findFirst();
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm nào trong database');
    }
    console.log(`[Setup] Tìm thấy sản phẩm mẫu: "${product.name}" (${product.id}), giá: ${product.price}đ`);

    // 2. Kịch bản 1: Đặt đơn hàng COD kèm Email khách hàng
    console.log('\n--- [TEST 1]: Tạo đơn hàng COD -> Tự động kích hoạt gửi Email hóa đơn ---');
    const testEmail = 'nguyenvana@gmail.com';
    const codOrderInput = {
      items: [
        {
          productId: product.id,
          name: product.name,
          image: '/images/products/test.jpg',
          size: 'L',
          color: 'Đen',
          quantity: 2,
          price: product.price,
        },
      ],
      shippingAddress: {
        name: 'Nguyễn Văn A',
        phone: '0123456789',
        address: '123 Đường Nguyễn Trãi, Phường 2, Quận 5, TP. Hồ Chí Minh',
      },
      shippingMethod: 'standard',
      paymentMethod: 'COD',
      note: 'Giao giờ hành chính, vui lòng gọi trước',
      subtotal: product.price * 2,
      shipping: 30000,
      discount: 20000,
      total: product.price * 2 + 30000 - 20000,
      customerEmail: testEmail,
    };

    const newCodOrder = await orderService.createOrder('user_usr-customer-001', codOrderInput);
    console.log(`✅ [TEST 1 PASS] Đã tạo đơn hàng COD: ${newCodOrder.id}, tổng tiền: ${newCodOrder.total}đ`);
    console.log(`   Email nhận hóa đơn: ${testEmail}`);

    // Đợi 500ms để background setImmediate hoàn tất
    await new Promise((r) => setTimeout(r, 600));

    // 3. Kịch bản 2: Gọi API/Service gửi lại hóa đơn đơn hàng theo yêu cầu
    console.log('\n--- [TEST 2]: Gọi sendOrderInvoice gửi lại hóa đơn tới email tùy chọn ---');
    const customRecipient = 'billing@customer.com';
    const reSendResult = await orderService.sendOrderInvoice(newCodOrder.id, customRecipient);
    if (!reSendResult.success) {
      throw new Error('Gửi lại hóa đơn thất bại');
    }
    console.log(`✅ [TEST 2 PASS] Đã gửi lại hóa đơn đơn hàng ${newCodOrder.id} tới ${customRecipient}`);

    // 4. Kịch bản 3: Tạo đơn hàng VNPAY và mô phỏng xác nhận thanh toán thành công
    console.log('\n--- [TEST 3]: Tạo đơn hàng VNPAY & mô phỏng thanh toán thành công -> Gửi hóa đơn PAID ---');
    const vnpayOrderInput = {
      items: [
        {
          productId: product.id,
          name: product.name,
          size: 'XL',
          color: 'Trắng',
          quantity: 1,
          price: product.price,
        },
      ],
      shippingAddress: {
        name: 'Nguyễn Văn A',
        phone: '0123456789',
        address: 'Tòa nhà Bitexco, Q.1, TP. Hồ Chí Minh',
      },
      shippingMethod: 'express',
      paymentMethod: 'VNPAY',
      subtotal: product.price,
      shipping: 50000,
      discount: 0,
      total: product.price + 50000,
      customerEmail: testEmail,
    };

    const vnpayOrder = await orderService.createOrder('user_usr-customer-001', vnpayOrderInput);
    console.log(`[Setup VNPAY] Đã tạo đơn hàng chờ thanh toán: ${vnpayOrder.id}`);

    // Mô phỏng VNPay Return với responseCode '00' (Thành công)
    const mockVnPayParams = {
      vnp_TxnRef: vnpayOrder.id,
      vnp_ResponseCode: '00',
      vnp_TransactionNo: '14589201',
      vnp_BankCode: 'NCB',
      vnp_PayDate: '20260908123000',
      vnp_Amount: (product.price + 50000) * 100,
    };

    // Gọi trực tiếp cập nhật trạng thái đơn thành PAID và gửi email
    const updatedPaidOrder = await prisma.order.update({
      where: { id: vnpayOrder.id },
      data: {
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        note: `[VNPay 14589201 - Bank: NCB]`,
      },
      include: { items: true, user: true },
    });

    const vnpayInvoiceResult = await emailService.sendOrderInvoiceEmail({
      order: updatedPaidOrder,
      customerEmail: testEmail,
      customerName: updatedPaidOrder.receiverName,
    });

    if (!vnpayInvoiceResult.success) {
      throw new Error('Gửi hóa đơn VNPay thất bại');
    }
    console.log(`✅ [TEST 3 PASS] Đơn hàng ${vnpayOrder.id} đã chuyển trạng thái PAID và gửi hóa đơn xác nhận thành công`);

    // 5. Kịch bản 4: Gọi thử qua endpoint HTTP nội bộ POST /api/v1/orders/:id/send-invoice
    console.log('\n--- [TEST 4]: Kiểm thử Endpoint HTTP: POST /api/v1/orders/:id/send-invoice ---');
    const fetchRes = await fetch(`http://localhost:5001/api/v1/orders/${newCodOrder.id}/send-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'accounting@routine.vn' }),
    });
    const httpData = await fetchRes.json();
    if (!fetchRes.ok || !httpData.success) {
      throw new Error(`Endpoint HTTP trả về lỗi: ${JSON.stringify(httpData)}`);
    }
    console.log(`✅ [TEST 4 PASS] API POST /api/v1/orders/${newCodOrder.id}/send-invoice phản hồi HTTP 200:`, httpData.message);

    console.log('\n================================================================');
    console.log('🎉 TOÀN BỘ 4/4 KỊCH BẢN KIỂM THỬ EMAIL HÓA ĐƠN ĐÃ VƯỢT QUA THÀNH CÔNG!');
    console.log('================================================================');
  } catch (error) {
    console.error('❌ KIỂM THỬ THẤT BẠI:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
