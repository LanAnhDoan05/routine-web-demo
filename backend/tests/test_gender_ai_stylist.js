const http = require('http');
const app = require('../app');
const prisma = require('../src/config/prisma');

const TEST_PORT = 5009;
const server = http.createServer(app);

server.listen(TEST_PORT, async () => {
  console.log(`--- RUNNING AI STYLIST GENDER FILTERING TESTS ON PORT ${TEST_PORT} ---\n`);

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

  const timestamp = Date.now();
  const maleEmail = `male_${timestamp}@routine.vn`;
  const femaleEmail = `female_${timestamp}@routine.vn`;
  const otherEmail = `other_${timestamp}@routine.vn`;

  try {
    // 1. Tạo tài khoản Nam ('men')
    const regMale = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Nguyễn Văn Nam',
        phoneNumber: '0971' + Math.floor(100000 + Math.random() * 900000),
        email: maleEmail,
        password: 'Password@123',
        gender: 'men',
      },
    });
    const maleToken = regMale.body.data.token;
    assert(regMale.status === 201 && regMale.body.data.user.gender === 'men', 'Created male user with gender="men"');

    // 2. Tạo tài khoản Nữ ('women')
    const regFemale = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Trần Thị Nữ',
        phoneNumber: '0972' + Math.floor(100000 + Math.random() * 900000),
        email: femaleEmail,
        password: 'Password@123',
        gender: 'women',
      },
    });
    const femaleToken = regFemale.body.data.token;
    assert(regFemale.status === 201 && regFemale.body.data.user.gender === 'women', 'Created female user with gender="women"');

    // 3. Tạo tài khoản Khác ('unisex')
    const regOther = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Lê Khác',
        phoneNumber: '0973' + Math.floor(100000 + Math.random() * 900000),
        email: otherEmail,
        password: 'Password@123',
        gender: 'unisex',
      },
    });
    const otherToken = regOther.body.data.token;
    assert(regOther.status === 201 && regOther.body.data.user.gender === 'unisex', 'Created other user with gender="unisex"');

    // TEST 1: Tài khoản Nam chat (không nói rõ giới tính trong câu chat)
    const maleAiRes = await request('/api/v1/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${maleToken}` },
      body: {
        message: 'Tư vấn cho mình một set đồ đi làm công sở',
        userPreferences: { gender: 'men' },
      },
    });
    assert(maleAiRes.status === 200, 'Male AI Stylist request returns status 200');
    assert(maleAiRes.body.data.intent.gender === 'men', 'AI Stylist identifies target gender as "men" for male user');
    if (maleAiRes.body.data.outfit && maleAiRes.body.data.outfit.products) {
      const allMenOrUnisex = maleAiRes.body.data.outfit.products.every(
        (p) => !p.gender || p.gender === 'men' || p.gender === 'unisex'
      );
      assert(allMenOrUnisex, 'Male user gets only men and unisex outfit products');
    }

    // TEST 2: Tài khoản Nữ chat (không nói rõ giới tính trong câu chat)
    const femaleAiRes = await request('/api/v1/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${femaleToken}` },
      body: {
        message: 'Tư vấn cho mình một set đồ đi làm công sở',
        userPreferences: { gender: 'women' },
      },
    });
    assert(femaleAiRes.status === 200, 'Female AI Stylist request returns status 200');
    assert(femaleAiRes.body.data.intent.gender === 'women', 'AI Stylist identifies target gender as "women" for female user');
    if (femaleAiRes.body.data.outfit && femaleAiRes.body.data.outfit.products) {
      const allWomenOrUnisex = femaleAiRes.body.data.outfit.products.every(
        (p) => !p.gender || p.gender === 'women' || p.gender === 'unisex'
      );
      assert(allWomenOrUnisex, 'Female user gets only women and unisex outfit products');
    }

    // TEST 3: Tài khoản Khác ('unisex') chat -> Đưa ra tất cả sản phẩm trong kho
    const otherAiRes = await request('/api/v1/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}` },
      body: {
        message: 'Tư vấn cho mình một set đồ đi dạo phố',
        userPreferences: { gender: 'unisex' },
      },
    });
    assert(otherAiRes.status === 200, 'Other (unisex) user AI Stylist request returns status 200');
    assert(otherAiRes.body.data.intent.gender === 'unisex', 'AI Stylist identifies target gender as "unisex" (all products in stock) for other user');

    // TEST 4: Khách vãng lai chưa đăng nhập -> Đưa ra tất cả sản phẩm trong kho (unisex)
    const guestAiRes = await request('/api/v1/ai/chat', {
      method: 'POST',
      body: {
        message: 'Tư vấn cho mình một set đồ đi chơi cuối tuần',
      },
    });
    assert(guestAiRes.status === 200, 'Guest AI Stylist request returns status 200');
    assert(guestAiRes.body.data.intent.gender === 'unisex', 'Guest without login defaults to "unisex" (all products in stock)');

    // TEST 5: Tài khoản Nam nhưng yêu cầu cụ thể tìm đồ Nữ trong tin nhắn
    const overrideAiRes = await request('/api/v1/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${maleToken}` },
      body: {
        message: 'Tư vấn cho mình một chiếc áo sơ mi nữ thanh lịch tặng bạn gái',
        userPreferences: { gender: 'men' },
      },
    });
    assert(overrideAiRes.status === 200, 'Prompt override request returns status 200');
    assert(
      overrideAiRes.body.data.intent.gender === 'women',
      'AI Stylist smartly overrides account gender to "women" when message explicitly requests female items'
    );

    // Dọn dẹp tài khoản test
    await prisma.user.deleteMany({
      where: { email: { in: [maleEmail, femaleEmail, otherEmail] } },
    });
    console.log('\n✔ Test cleanup completed.');
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed}/${total} PASSED`);
    console.log(`========================================`);
    server.close();
    await prisma.$disconnect();
    process.exit(passed === total ? 0 : 1);
  }
});
