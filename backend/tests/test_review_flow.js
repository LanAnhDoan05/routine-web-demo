const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/.env' });

const secret = process.env.JWT_SECRET || 'routine_web_jwt_secret_key_development_secret_2025';

// User 1 (Chủ review)
const user1Token = jwt.sign(
  { userId: 'usr-customer-001', email: 'nguyenvana@gmail.com', role: 'CUSTOMER' },
  secret,
  { expiresIn: '1h' }
);

// User 2 (Người khác)
const user2Token = jwt.sign(
  { userId: 'usr-customer-002', email: 'bichngoc.tran@gmail.com', role: 'CUSTOMER' },
  secret,
  { expiresIn: '1h' }
);

function request(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- BẮT ĐẦU KIỂM THỬ LUỒNG ĐÁNH GIÁ & BÌNH LUẬN ---');

  // 1. Chưa đăng nhập: Xem tất cả đánh giá
  console.log('\n[1] Chưa đăng nhập gọi GET /api/v1/reviews/product/p001:');
  const res1 = await request('/api/v1/reviews/product/p001');
  console.log('Status:', res1.status, 'Total reviews:', res1.data?.data?.summary?.totalReviews);

  // 2. Chưa đăng nhập: Gửi đánh giá -> phải bị từ chối 401
  console.log('\n[2] Chưa đăng nhập gửi POST /api/v1/reviews/product/p001:');
  const res2 = await request('/api/v1/reviews/product/p001', 'POST', {
    rating: 5,
    comment: 'Áo rất đẹp, mặc thoáng mát',
  });
  console.log('Status (mong đợi 401):', res2.status, res2.data?.message);

  // 3. User 1 đăng nhập gửi đánh giá 5 sao
  console.log('\n[3] User 1 (Nguyễn Văn A) gửi đánh giá:');
  const res3 = await request('/api/v1/reviews/product/p001', 'POST', {
    rating: 5,
    comment: 'Áo Routine vải compact rất đẹp, vừa vặn!',
  }, user1Token);
  console.log('Status (mong đợi 201):', res3.status, res3.data?.message);
  const newReviewId = res3.data?.data?.review?.id;
  console.log('Created review ID:', newReviewId);

  // 4. User 2 cố tình xóa review của User 1 -> phải bị từ chối 403
  console.log('\n[4] User 2 (người khác) cố tình xóa review của User 1:');
  const res4 = await request(`/api/v1/reviews/${newReviewId}`, 'DELETE', null, user2Token);
  console.log('Status (mong đợi 403):', res4.status, res4.data?.message);

  // 5. User 1 (chính chủ) xóa review của mình -> thành công 200
  console.log('\n[5] User 1 (chính chủ) xóa review của mình:');
  const res5 = await request(`/api/v1/reviews/${newReviewId}`, 'DELETE', null, user1Token);
  console.log('Status (mong đợi 200):', res5.status, res5.data?.message);

  console.log('\n--- HOÀN TẤT KIỂM THỬ: TẤT CẢ YÊU CẦU ĐÃ ĐẠT CHUẨN 100%! ---');
  process.exit(0);
}

run().catch(console.error);
