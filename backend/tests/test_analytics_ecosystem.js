const http = require('http');

function postJson(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(path, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method: 'GET',
      headers: {},
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ HỆ SINH THÁI ĐA NỀN TẢNG ---');

  // 1. Gửi sự kiện tracking từ TikTok
  console.log('\n[1] Gửi tracking click từ TikTok:');
  const res1 = await postJson('/api/v1/analytics/track', {
    platform: 'tiktok',
    campaign: 'tiktok_viral_look_01',
    productId: 'p001',
    guestSessionId: 'guest_test_tiktok_123',
    action: 'VIEW',
    metadata: { referrer: 'https://tiktok.com/@routine' },
  });
  console.log('Kết quả tracking TikTok:', res1.status, res1.data?.message);

  // 2. Gửi sự kiện tracking từ Facebook
  console.log('\n[2] Gửi tracking click từ Facebook:');
  const res2 = await postJson('/api/v1/analytics/track', {
    platform: 'facebook',
    campaign: 'fb_summer_sale',
    productId: 'p002',
    guestSessionId: 'guest_test_fb_456',
    action: 'VIEW',
    metadata: { referrer: 'https://facebook.com/ads' },
  });
  console.log('Kết quả tracking Facebook:', res2.status, res2.data?.message);

  // 3. Gửi sự kiện tracking từ Instagram
  console.log('\n[3] Gửi tracking click từ Instagram:');
  const res3 = await postJson('/api/v1/analytics/track', {
    platform: 'instagram',
    campaign: 'ig_reels_outfit',
    productId: 'p003',
    guestSessionId: 'guest_test_ig_789',
    action: 'VIEW',
    metadata: { referrer: 'https://instagram.com/routine_vietnam' },
  });
  console.log('Kết quả tracking Instagram:', res3.status, res3.data?.message);

  // 4. Sinh token Admin để kiểm tra endpoint bảo mật
  console.log('\n[4] Khởi tạo Token Admin:');
  require('dotenv').config();
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'routine_web_jwt_secret_key_development_secret_2025';
  const token = jwt.sign(
    { userId: 'test_admin_01', email: 'admin@routine.vn', phoneNumber: '0909999999', role: 'ADMIN' },
    secret,
    { expiresIn: '1h' }
  );
  console.log('Token exists:', Boolean(token));

  // 5. Kiểm tra API tổng kết hệ sinh thái /api/v1/analytics/admin/overview
  console.log('\n[5] Gọi API /api/v1/analytics/admin/overview:');
  const overview = await getJson('/api/v1/analytics/admin/overview', token);
  console.log('Overview status:', overview.status);
  console.log('Summary:', overview.data?.data?.summary);
  console.log('Breakdown TikTok:', overview.data?.data?.breakdown?.TIKTOK);
  console.log('Breakdown Facebook:', overview.data?.data?.breakdown?.FACEBOOK);
  console.log('Breakdown Instagram:', overview.data?.data?.breakdown?.INSTAGRAM);

  // 6. Kiểm tra API danh sách khách vãng lai /api/v1/analytics/admin/guests
  console.log('\n[6] Gọi API /api/v1/analytics/admin/guests:');
  const guests = await getJson('/api/v1/analytics/admin/guests?limit=5', token);
  console.log('Guests status:', guests.status, 'Total sessions:', guests.data?.data?.pagination?.total);
  console.log('Mẫu khách vãng lai:', guests.data?.data?.items?.[0]);

  // 7. Kiểm tra API danh sách khách hàng /api/v1/admin/customers
  console.log('\n[7] Gọi API /api/v1/admin/customers:');
  const customers = await getJson('/api/v1/admin/customers?limit=5', token);
  console.log('Customers status:', customers.status, 'Total customers:', customers.data?.data?.pagination?.totalItems);
  console.log('Mẫu khách hàng có trường source:', customers.data?.data?.items?.[0]?.source);

  console.log('\n--- HOÀN TẤT KIỂM THỬ BACKEND ---');
}

runTests().catch(console.error);
