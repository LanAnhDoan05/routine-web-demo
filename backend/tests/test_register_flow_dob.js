const http = require('http');
const app = require('../app');
const prisma = require('../src/config/prisma');

const TEST_PORT = 5007;
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

  const testPhone = '0966' + Math.floor(100000 + Math.random() * 900000);
  const testEmail = `test_dob_${Date.now()}@routine.vn`;
  const birthDate = '1998-05-20';

  try {
    // 1. Validation test: Future birthdate rejected
    const invalidRes = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Trần Văn Tương Lai',
        phoneNumber: '0977112233',
        email: 'future@routine.vn',
        password: 'Password@123',
        dateOfBirth: '2099-01-01',
      },
    });
    assert(
      invalidRes.status === 400 && invalidRes.body.message.includes('Ngày tháng năm sinh không hợp lệ'),
      'Reject registration with future birthdate (2099-01-01)'
    );

    // 2. Register with valid date of birth
    const regRes = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Lê Hoàng Sinh Nhật',
        phoneNumber: testPhone,
        email: testEmail,
        password: 'Password@123',
        gender: 'men',
        dateOfBirth: birthDate,
        stylePreference: 'smart-casual',
      },
    });

    assert(
      regRes.status === 201 && regRes.body.success === true,
      'POST /api/v1/auth/register registers user with dateOfBirth'
    );
    assert(
      regRes.body.data.user.dateOfBirth === birthDate,
      `Registered user response has dateOfBirth "${birthDate}"`
    );
    assert(
      regRes.body.data.user.date === birthDate,
      `Registered user response has date alias "${birthDate}"`
    );

    // 3. Query Prisma DB to confirm persistent storage in MySQL
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert(
      dbUser !== null,
      'Database persistently found user record'
    );
    const dbDobStr = dbUser.dateOfBirth ? dbUser.dateOfBirth.toISOString().split('T')[0] : null;
    assert(
      dbDobStr === birthDate,
      `Database column date_of_birth stored correctly as "${birthDate}"`
    );
    const dbDateStr = dbUser.date ? dbUser.date.toISOString().split('T')[0] : null;
    assert(
      dbDateStr === birthDate,
      `Database column date stored correctly as "${birthDate}"`
    );

    // 4. Test login returns birth date
    const loginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        phoneNumber: testPhone,
        password: 'Password@123',
      },
    });
    assert(
      loginRes.status === 200 && loginRes.body.data.user.dateOfBirth === birthDate,
      'POST /api/v1/auth/login returns user with dateOfBirth'
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
