const http = require('http');
const app = require('../app');
const config = require('../src/config/vnpay');
const { createSecureHash } = require('../src/utils/vnpayHelper');

const server = http.createServer(app);
const TEST_PORT = 5012;

server.listen(TEST_PORT, async () => {
  console.log(`VNPay test server running on port ${TEST_PORT}\n`);

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
    // 1. Tạo URL thanh toán VNPay Sandbox cho đơn hàng mẫu
    const createRes = await request('/api/v1/payment/vnpay/create-payment-url', {
      method: 'POST',
      body: {
        orderId: 'ORD-TEST-0001',
        amount: 350000,
        orderInfo: 'Thanh toan don hang test ORD-TEST-0001',
        bankCode: 'NCB',
      },
    });

    assert(
      createRes.status === 201 &&
        createRes.body.success === true &&
        createRes.body.data.paymentUrl &&
        createRes.body.data.paymentUrl.includes('sandbox.vnpayment.vn') &&
        createRes.body.data.paymentUrl.includes('vnp_SecureHash='),
      'POST /api/v1/payment/vnpay/create-payment-url sinh URL VNPay Sandbox hợp lệ có chữ ký SHA512'
    );

    // 2. Mô phỏng Return URL thành công từ VNPay (ResponseCode = '00')
    const validParams = {
      vnp_Amount: '35000000',
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: 'VNP14082522',
      vnp_CardType: 'ATM',
      vnp_OrderInfo: 'Thanh toan don hang test ORD-TEST-0001',
      vnp_PayDate: '20260908013000',
      vnp_ResponseCode: '00',
      vnp_TmnCode: config.vnp_TmnCode,
      vnp_TransactionNo: '14082522',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: 'ORD-TEST-0001',
    };
    const validHash = createSecureHash(validParams, config.vnp_HashSecret);
    const validQuery = new URLSearchParams({
      ...validParams,
      vnp_SecureHash: validHash,
    }).toString();

    const verifySuccessRes = await request(`/api/v1/payment/vnpay/verify-return?${validQuery}`);
    assert(
      verifySuccessRes.status === 200 &&
        verifySuccessRes.body.data.valid === true &&
        verifySuccessRes.body.data.success === true &&
        verifySuccessRes.body.data.responseCode === '00' &&
        verifySuccessRes.body.data.amount === 350000,
      'GET /api/v1/payment/vnpay/verify-return xác thực giao dịch thành công khi chữ ký và ResponseCode = 00'
    );

    // 3. Mô phỏng Return URL với chữ ký giả mạo (tampered hash)
    const tamperedQuery = new URLSearchParams({
      ...validParams,
      vnp_SecureHash: 'fake_tampered_hash_123456abcdef',
    }).toString();

    const verifyTamperedRes = await request(`/api/v1/payment/vnpay/verify-return?${tamperedQuery}`);
    assert(
      verifyTamperedRes.status === 200 &&
        verifyTamperedRes.body.data.valid === false &&
        verifyTamperedRes.body.data.success === false,
      'GET /api/v1/payment/vnpay/verify-return phát hiện và từ chối chữ ký giả mạo'
    );

    // 4. Mô phỏng Return URL khi người dùng hủy giao dịch (ResponseCode = '24')
    const cancelParams = {
      vnp_Amount: '35000000',
      vnp_BankCode: 'NCB',
      vnp_OrderInfo: 'Thanh toan don hang test ORD-TEST-0001',
      vnp_ResponseCode: '24',
      vnp_TmnCode: config.vnp_TmnCode,
      vnp_TxnRef: 'ORD-TEST-0001',
    };
    const cancelHash = createSecureHash(cancelParams, config.vnp_HashSecret);
    const cancelQuery = new URLSearchParams({
      ...cancelParams,
      vnp_SecureHash: cancelHash,
    }).toString();

    const verifyCancelRes = await request(`/api/v1/payment/vnpay/verify-return?${cancelQuery}`);
    assert(
      verifyCancelRes.status === 200 &&
        verifyCancelRes.body.data.valid === true &&
        verifyCancelRes.body.data.success === false &&
        verifyCancelRes.body.data.responseCode === '24' &&
        verifyCancelRes.body.data.message.includes('hủy'),
      'GET /api/v1/payment/vnpay/verify-return nhận diện chính xác trạng thái khách hàng hủy (ResponseCode 24)'
    );

    // 5. Test IPN webhook
    const ipnRes = await request(`/api/v1/payment/vnpay/vnpay-ipn?${validQuery}`);
    assert(
      ipnRes.status === 200 &&
        typeof ipnRes.body.RspCode === 'string',
      'GET /api/v1/payment/vnpay/vnpay-ipn phản hồi đúng định dạng JSON chuẩn của VNPay'
    );

  } catch (err) {
    console.error('Lỗi khi chạy test:', err);
  } finally {
    console.log(`\nKết quả kiểm thử VNPay API: ${passed}/${total} passed`);
    server.close(() => {
      process.exit(passed === total ? 0 : 1);
    });
  }
});
