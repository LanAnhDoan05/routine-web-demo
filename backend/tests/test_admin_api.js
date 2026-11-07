const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../app');

const server = http.createServer(app);
const TEST_PORT = 5006;
const JWT_SECRET = process.env.JWT_SECRET || 'routine_web_jwt_secret_key_change_me';

// Sinh test token cho Customer và Admin
const customerToken = jwt.sign(
  { userId: 'test_cust_01', email: 'cust@test.com', phoneNumber: '0901111111', role: 'CUSTOMER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { userId: 'test_admin_01', email: 'admin@routine.vn', phoneNumber: '0909999999', role: 'ADMIN' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

server.listen(TEST_PORT, async () => {
  console.log(`Admin API test server running on port ${TEST_PORT}\n`);

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
    // 1. Phân quyền: Từ chối request không có token
    const noAuth = await request('/api/v1/products', {
      method: 'POST',
      body: { name: 'Test Shirt', price: 100000, category: 'tops' },
    });
    assert(noAuth.status === 401, 'POST /api/v1/products rejects without token (401)');

    // 2. Phân quyền: Từ chối tài khoản CUSTOMER
    const custAuth = await request('/api/v1/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { name: 'Test Shirt', price: 100000, category: 'tops' },
    });
    assert(custAuth.status === 403, 'POST /api/v1/products rejects CUSTOMER role (403)');

    // 3. Admin CUD Sản phẩm: Thêm sản phẩm mới
    const createProd = await request('/api/v1/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Áo Polo Premium Admin Test',
        category: 'tops',
        price: 350000,
        originalPrice: 450000,
        gender: 'men',
        style: ['smart-casual'],
        description: 'Áo polo cao cấp chất liệu gai xịn',
      },
    });
    assert(
      createProd.status === 201 &&
        createProd.body.success === true &&
        createProd.body.data.id.startsWith('p') &&
        createProd.body.data.name === 'Áo Polo Premium Admin Test',
      'POST /api/v1/products creates product successfully with ADMIN token'
    );

    const createdProdId = createProd.body.data.id;

    // 4. Kiểm tra sản phẩm vừa thêm đã xem được qua GET public
    const getProd = await request(`/api/v1/products/${createdProdId}`);
    assert(
      getProd.status === 200 && getProd.body.data.name === 'Áo Polo Premium Admin Test',
      'GET /api/v1/products/:id retrieves newly created product'
    );

    // 5. Admin CUD Sản phẩm: Cập nhật sản phẩm
    const updateProd = await request(`/api/v1/products/${createdProdId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        price: 299000,
        badge: 'SALE',
      },
    });
    assert(
      updateProd.status === 200 &&
        updateProd.body.data.price === 299000 &&
        updateProd.body.data.badge === 'SALE',
      'PUT /api/v1/products/:id updates product details'
    );

    // 6. Admin CUD Sản phẩm: Xóa sản phẩm
    const deleteProd = await request(`/api/v1/products/${createdProdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteProd.status === 200, 'DELETE /api/v1/products/:id deletes product');

    // 7. Xác nhận sản phẩm đã xóa không còn tồn tại (404)
    const getDeletedProd = await request(`/api/v1/products/${createdProdId}`);
    assert(getDeletedProd.status === 404, 'GET /api/v1/products/:id returns 404 after deletion');

    // 8. Admin CUD Danh mục: Thêm danh mục mới
    const createCat = await request('/api/v1/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Đồ Bơi & Phụ Kiện',
        slug: 'swimwear-accessories',
        description: 'Bộ sưu tập đồ bơi hè Routine',
        type: 'quick',
      },
    });
    assert(
      createCat.status === 201 && createCat.body.data.slug === 'swimwear-accessories',
      'POST /api/v1/categories creates new category'
    );

    // 9. Admin CUD Danh mục: Cập nhật danh mục
    const updateCat = await request('/api/v1/categories/swimwear-accessories', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        description: 'Mô tả đã được admin cập nhật',
      },
    });
    assert(
      updateCat.status === 200 && updateCat.body.data.description === 'Mô tả đã được admin cập nhật',
      'PUT /api/v1/categories/:slug updates category'
    );

    // 10. Admin CUD Danh mục: Xóa danh mục
    const deleteCat = await request('/api/v1/categories/swimwear-accessories', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteCat.status === 200, 'DELETE /api/v1/categories/:slug deletes category');

    // 11. Admin CUD Smart Outfit: Thêm outfit mới
    const createOutfit = await request('/api/v1/outfits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Admin Special Summer Look',
        style: 'streetstyle',
        occasion: 'weekend',
        productIds: ['p001', 'p005'],
        description: 'Bộ phối phong cách hè cá tính do Admin tuyển chọn',
      },
    });
    assert(
      createOutfit.status === 201 &&
        createOutfit.body.data.id.startsWith('o') &&
        createOutfit.body.data.products.length === 2,
      'POST /api/v1/outfits creates new outfit combo'
    );

    const createdOutfitId = createOutfit.body.data.id;

    // 12. Admin CUD Smart Outfit: Cập nhật outfit
    const updateOutfit = await request(`/api/v1/outfits/${createdOutfitId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Admin Updated Summer Look',
      },
    });
    assert(
      updateOutfit.status === 200 &&
        updateOutfit.body.data.name === 'Admin Updated Summer Look',
      'PUT /api/v1/outfits/:id updates outfit'
    );

    // 13. Admin CUD Smart Outfit: Xóa outfit
    const deleteOutfit = await request(`/api/v1/outfits/${createdOutfitId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteOutfit.status === 200, 'DELETE /api/v1/outfits/:id deletes outfit');

    // 14. Admin Đơn hàng: Xem toàn bộ đơn hàng
    const adminOrders = await request('/api/v1/orders/admin/all', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminOrders.status === 200 &&
        Array.isArray(adminOrders.body.data.items) &&
        adminOrders.body.data.items.length > 0,
      'GET /api/v1/orders/admin/all retrieves all orders across customers'
    );

    // 15. Admin Đơn hàng: Cập nhật trạng thái đơn sang shipping
    const updateStatus = await request('/api/v1/orders/ORD-2026-0001/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'shipping' },
    });
    assert(
      updateStatus.status === 200 && updateStatus.body.data.status === 'shipping',
      'PATCH /api/v1/orders/:id/status updates status to shipping'
    );

    // 16. Admin Đơn hàng: Cập nhật trạng thái đơn sang delivered
    const updateDelivered = await request('/api/v1/orders/ORD-2026-0001/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'delivered' },
    });
    assert(
      updateDelivered.status === 200 && updateDelivered.body.data.status === 'delivered',
      'PATCH /api/v1/orders/:id/status updates status to delivered'
    );

    console.log(`\nAdmin API Test Results: ${passed}/${total} tests passed.`);
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
  }
});
