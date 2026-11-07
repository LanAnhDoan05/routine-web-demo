const http = require('http');
const app = require('../app');

const server = http.createServer(app);

server.listen(5015, async () => {
  console.log('Test server running on port 5015');

  async function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5015,
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
    assert(health.status === 200 && health.body.success === true, 'GET /api/v1/health returns 200');

    // 2. Register validation: missing name
    const reg1 = await request('/api/v1/auth/register', {
      method: 'POST',
      body: { fullName: 'A', phoneNumber: '0912345678', email: 'test@example.com', password: '123' },
    });
    assert(reg1.status === 400 && reg1.body.message.includes('Họ và tên'), 'Register: Reject invalid name');

    // 3. Register validation: invalid phone
    const reg2 = await request('/api/v1/auth/register', {
      method: 'POST',
      body: { fullName: 'Nguyễn Văn A', phoneNumber: '12345', email: 'test@example.com', password: 'password123' },
    });
    assert(reg2.status === 400 && reg2.body.message.includes('Số điện thoại'), 'Register: Reject invalid phone');

    // 4. Register validation: invalid email
    const reg3 = await request('/api/v1/auth/register', {
      method: 'POST',
      body: { fullName: 'Nguyễn Văn A', phoneNumber: '0912345678', email: 'not-an-email', password: 'password123' },
    });
    assert(reg3.status === 400 && reg3.body.message.includes('email'), 'Register: Reject invalid email');

    // 5. Register validation: short password
    const reg4 = await request('/api/v1/auth/register', {
      method: 'POST',
      body: { fullName: 'Nguyễn Văn A', phoneNumber: '0912345678', email: 'test@gmail.com', password: '123' },
    });
    assert(reg4.status === 400 && reg4.body.message.includes('Mật khẩu'), 'Register: Reject short password');

    // 6. Login validation: missing phone
    const log1 = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { phoneNumber: '', password: '123' },
    });
    assert(log1.status === 400 && log1.body.message.includes('số điện thoại'), 'Login: Reject missing phone');

    // 7. Login validation: missing password
    const log2 = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { phoneNumber: '0912345678', password: '' },
    });
    assert(log2.status === 400 && log2.body.message.includes('mật khẩu'), 'Login: Reject missing password');

    // 8. Auth /me without token
    const me1 = await request('/api/v1/auth/me');
    assert(me1.status === 401 && me1.body.success === false, 'GET /api/v1/auth/me rejects without token');

    // 9. AI suggestion without token
    const ai1 = await request('/api/v1/ai/suggest', {
      method: 'POST',
      body: { goal: 'Học tiếng Anh' },
    });
    assert(ai1.status === 401, 'POST /api/v1/ai/suggest rejects without token');

    // 10. 404 Route
    const notFound = await request('/api/v1/non-existent-route');
    assert(notFound.status === 404 && notFound.body.success === false, '404 Handler works properly');

    console.log(`\nResults: ${passed}/${total} tests passed.`);
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
  }
});
