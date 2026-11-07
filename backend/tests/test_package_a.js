const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../app');
const prisma = require('../src/config/prisma');

const server = http.createServer(app);
const TEST_PORT = 5007;
const JWT_SECRET = process.env.JWT_SECRET || 'routine_web_jwt_secret_key_change_me';
const testUserId = 'usr-pkg-a-test';

const testUserToken = jwt.sign(
  { userId: testUserId, email: 'pkg_a_test@routine.vn', phoneNumber: '0977665544', role: 'CUSTOMER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

server.listen(TEST_PORT, async () => {
  console.log(`Package A test server running on port ${TEST_PORT}\n`);

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
    await prisma.address.deleteMany({ where: { userId: testUserId } });
    const hash = await bcrypt.hash('any_or_bypass', 10);
    await prisma.user.upsert({
      where: { id: testUserId },
      update: { passwordHash: hash },
      create: {
        id: testUserId,
        fullName: 'Test Package A',
        email: 'pkg_a_test@routine.vn',
        phoneNumber: '0977665544',
        passwordHash: hash,
        role: 'CUSTOMER',
      },
    });
    // 1. Thêm địa chỉ mới
    const addAddr = await request('/api/v1/users/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: {
        receiverName: 'Lê Hoàng Nam',
        phone: '0988776655',
        street: '789 Trần Hưng Đạo',
        ward: 'Phường 7',
        district: 'Quận 5',
        city: 'Hồ Chí Minh',
      },
    });
    assert(
      addAddr.status === 201 &&
        addAddr.body.success === true &&
        addAddr.body.data.receiverName === 'Lê Hoàng Nam' &&
        addAddr.body.data.isDefault === true,
      'POST /api/v1/users/addresses creates first address as default'
    );

    const addressId = addAddr.body.data.id;

    // 2. Thêm địa chỉ thứ 2
    const addAddr2 = await request('/api/v1/users/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: {
        receiverName: 'Lê Hoàng Nam (Công ty)',
        phone: '0988776655',
        street: '12 Tôn Đức Thắng',
        ward: 'Bến Nghé',
        district: 'Quận 1',
        city: 'Hồ Chí Minh',
        isDefault: true,
      },
    });
    assert(
      addAddr2.status === 201 && addAddr2.body.data.isDefault === true,
      'POST /api/v1/users/addresses creates second address and sets it as new default'
    );

    const address2Id = addAddr2.body.data.id;

    // 3. Lấy danh sách địa chỉ
    const listAddr = await request('/api/v1/users/addresses', {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    assert(
      listAddr.status === 200 &&
        Array.isArray(listAddr.body.data) &&
        listAddr.body.data.length === 2 &&
        listAddr.body.data[0].id === address2Id,
      'GET /api/v1/users/addresses returns list with default address on top'
    );

    // 4. Sửa địa chỉ
    const updateAddr = await request(`/api/v1/users/addresses/${addressId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: {
        receiverName: 'Lê Hoàng Nam (Nhà riêng VIP)',
      },
    });
    assert(
      updateAddr.status === 200 &&
        updateAddr.body.data.receiverName === 'Lê Hoàng Nam (Nhà riêng VIP)',
      'PUT /api/v1/users/addresses/:id updates address fields'
    );

    // 5. Đặt địa chỉ 1 lại làm mặc định
    const setDefault = await request(`/api/v1/users/addresses/${addressId}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    assert(
      setDefault.status === 200 && setDefault.body.data.isDefault === true,
      'PATCH /api/v1/users/addresses/:id/default sets default address'
    );

    // 6. Xóa địa chỉ 2
    const delAddr = await request(`/api/v1/users/addresses/${address2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    assert(delAddr.status === 200, 'DELETE /api/v1/users/addresses/:id deletes address');

    // 7. Đổi mật khẩu
    const changePass = await request('/api/v1/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: {
        oldPassword: 'any_or_bypass',
        newPassword: 'mySuperNewPassword123',
      },
    });
    assert(
      changePass.status === 200 && changePass.body.success === true,
      'PUT /api/v1/auth/change-password updates user password'
    );

    // 8. Tìm kiếm gợi ý (Autocomplete)
    const suggest = await request('/api/v1/search/suggestions?q=cotton');
    assert(
      suggest.status === 200 &&
        suggest.body.data.products.length > 0 &&
        suggest.body.data.products[0].name.toLowerCase().includes('cotton'),
      'GET /api/v1/search/suggestions returns matching products autocomplete'
    );

    // 9. Từ khóa thịnh hành
    const trending = await request('/api/v1/search/trending');
    assert(
      trending.status === 200 && Array.isArray(trending.body.data) && trending.body.data.length >= 5,
      'GET /api/v1/search/trending returns trending search keywords'
    );

    // 10. Đăng ký nhận bản tin
    const subNews = await request('/api/v1/newsletter/subscribe', {
      method: 'POST',
      body: { email: 'routine_fan@gmail.com' },
    });
    assert(
      subNews.status === 201 &&
        subNews.body.data.welcomeCoupon === 'ROUTINE10' &&
        subNews.body.data.isNew === true,
      'POST /api/v1/newsletter/subscribe registers subscriber and gives welcome voucher'
    );

    console.log(`\nPackage A Test Results: ${passed}/${total} tests passed.`);
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
  }
});
