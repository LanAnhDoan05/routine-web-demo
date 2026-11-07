const http = require('http');
const app = require('../app');
const prisma = require('../src/config/prisma');

const TEST_PORT = 5006;
const server = http.createServer(app);

server.listen(TEST_PORT, async () => {
  console.log(`Test server running on port ${TEST_PORT}\n`);

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

  const testPhone = '0988' + Math.floor(100000 + Math.random() * 900000);
  const testEmail = `test_gender_${Date.now()}@routine.vn`;

  try {
    // 1. Register with gender: 'women'
    const regRes = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Nguyễn Thị Hoa',
        phoneNumber: testPhone,
        email: testEmail,
        password: 'Password@123',
        gender: 'women',
        stylePreference: 'minimal',
      },
    });

    assert(
      regRes.status === 201 && regRes.body.success === true,
      'POST /api/v1/auth/register registers user directly without OTP'
    );
    assert(
      regRes.body.data.user.gender === 'women',
      'Registered user has gender "women"'
    );
    assert(
      Boolean(regRes.body.data.token),
      'JWT token returned upon registration'
    );

    // 2. Query Prisma DB to confirm persistent gender in MySQL
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert(
      dbUser && dbUser.gender === 'women',
      'Database persistently stored user gender as "women"'
    );

    // 3. Login with that account
    const loginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        phoneNumber: testPhone,
        password: 'Password@123',
      },
    });
    assert(
      loginRes.status === 200 && loginRes.body.data.user.gender === 'women',
      'POST /api/v1/auth/login returns user with correct gender'
    );

    // 4. Test AI Stylist receives userPreferences.gender
    const aiRes = await request('/api/v1/ai/chat', {
      method: 'POST',
      body: {
        message: 'Tư vấn set đồ dạo phố cuối tuần',
        userPreferences: {
          gender: 'women',
          style: 'minimal',
        },
      },
    });
    assert(
      aiRes.status === 200 && aiRes.body.success === true,
      'POST /api/v1/ai/chat responds successfully with userPreferences.gender'
    );

    // Cleanup test user
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    console.log('Cleaned up test user successfully');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    console.log(`\nResults: ${passed}/${total} tests passed.`);
    server.close();
    await prisma.$disconnect();
    process.exit(passed === total ? 0 : 1);
  }
});
