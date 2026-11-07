/**
 * Test Suite: Admin Extensions & 4 New Feature Modules
 * 1. Styles Management (CRUD + Counts)
 * 2. Customer Management for Admin (List, Details with Orders, Status update)
 * 3. Product Extensions (Duplicate, Check SKU, Bulk Delete, Image Upload)
 * 4. Reviews Moderation (All reviews, Stats, Status moderation)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../app');
const { generateToken } = require('../src/services/authService');

const PORT = 5099;
let server;

const adminToken = generateToken({
  id: 'adm-test-001',
  email: 'admin@routine.vn',
  phoneNumber: '0999999999',
  role: 'ADMIN',
});

const userToken = generateToken({
  id: 'usr-customer-001',
  email: 'nguyenvana@gmail.com',
  phoneNumber: '0123456789',
  role: 'CUSTOMER',
});

function request({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const isMultipart = headers['Content-Type'] && headers['Content-Type'].startsWith('multipart/form-data');
    let payload = null;

    if (body) {
      if (isMultipart) {
        payload = body;
      } else {
        payload = typeof body === 'string' ? body : JSON.stringify(body);
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function buildMultipartBody(boundary, fieldName, filename, mimeType, buffer) {
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return Buffer.concat([head, buffer, tail]);
}

async function runTests() {
  server = app.listen(PORT);
  console.log(`[TEST SERVER] Running on port ${PORT}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ==========================================
    // MODULE 1: STYLES MANAGEMENT
    // ==========================================
    console.log('--- 1. STYLES MANAGEMENT TESTS ---');

    // 1.1 GET /api/v1/styles
    const resStyles = await request({ method: 'GET', path: '/api/v1/styles' });
    assert(resStyles.status === 200 && Array.isArray(resStyles.data.data), 'GET /api/v1/styles returns styles array');
    const initialStylesCount = resStyles.data.data.length;

    // 1.2 GET /api/v1/styles/counts
    const resCounts = await request({ method: 'GET', path: '/api/v1/styles/counts' });
    assert(
      resCounts.status === 200 && typeof resCounts.data.data === 'object' && resCounts.data.data.minimal > 0,
      'GET /api/v1/styles/counts returns product count per style'
    );

    // 1.3 POST /api/v1/styles (Forbidden for non-admin)
    const resAddForbidden = await request({
      method: 'POST',
      path: '/api/v1/styles',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { name: 'Bohemian' },
    });
    assert(resAddForbidden.status === 403, 'POST /api/v1/styles blocks regular user (403)');

    // 1.4 POST /api/v1/styles (Admin creates new style)
    const testStyleSlug = `bohemian-${Date.now()}`;
    const resCreateStyle = await request({
      method: 'POST',
      path: '/api/v1/styles',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Bohemian Chic',
        slug: testStyleSlug,
        description: 'Phong cách phóng khoáng, họa tiết thổ cẩm',
        image: '/images/styles/bohemian.jpg',
      },
    });
    assert(resCreateStyle.status === 201 && resCreateStyle.data.data.slug === testStyleSlug, 'POST /api/v1/styles creates style');

    // 1.5 GET /api/v1/styles/:idOrSlug
    const resGetStyle = await request({ method: 'GET', path: `/api/v1/styles/${testStyleSlug}` });
    assert(resGetStyle.status === 200 && resGetStyle.data.data.name === 'Bohemian Chic', 'GET /api/v1/styles/:idOrSlug retrieves style');

    // 1.6 PUT /api/v1/styles/:idOrSlug
    const resUpdateStyle = await request({
      method: 'PUT',
      path: `/api/v1/styles/${testStyleSlug}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        description: 'Đã cập nhật mô tả phong cách bohemian',
        status: 'INACTIVE',
      },
    });
    assert(
      resUpdateStyle.status === 200 && resUpdateStyle.data.data.status === 'INACTIVE',
      'PUT /api/v1/styles/:idOrSlug updates style'
    );

    // 1.7 DELETE /api/v1/styles/:idOrSlug
    const resDeleteStyle = await request({
      method: 'DELETE',
      path: `/api/v1/styles/${testStyleSlug}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resDeleteStyle.status === 200 && resDeleteStyle.data.success, 'DELETE /api/v1/styles/:idOrSlug deletes style');

    // ==========================================
    // MODULE 2: CUSTOMER MANAGEMENT (ADMIN)
    // ==========================================
    console.log('\n--- 2. CUSTOMER MANAGEMENT TESTS ---');

    // 2.1 GET /api/v1/admin/customers (Forbidden for non-admin)
    const resCustForbidden = await request({
      method: 'GET',
      path: '/api/v1/admin/customers',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(resCustForbidden.status === 403, 'GET /api/v1/admin/customers blocks regular user (403)');

    // 2.2 GET /api/v1/admin/customers (Admin access)
    const resCustomers = await request({
      method: 'GET',
      path: '/api/v1/admin/customers',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      resCustomers.status === 200 &&
        Array.isArray(resCustomers.data.data.items) &&
        resCustomers.data.data.items.length > 0 &&
        resCustomers.data.data.pagination.totalItems > 0,
      'GET /api/v1/admin/customers returns paginated customer list'
    );
    const firstCustomer = resCustomers.data.data.items[0];

    // 2.3 Search customer
    const resSearchCust = await request({
      method: 'GET',
      path: `/api/v1/admin/customers?search=${encodeURIComponent(firstCustomer.fullName)}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      resSearchCust.status === 200 && resSearchCust.data.data.items.length >= 1,
      'GET /api/v1/admin/customers?search filters by customer name'
    );

    // 2.4 GET /api/v1/admin/customers/:id
    const resCustDetail = await request({
      method: 'GET',
      path: `/api/v1/admin/customers/${firstCustomer.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      resCustDetail.status === 200 &&
        resCustDetail.data.data.statistics !== undefined &&
        Array.isArray(resCustDetail.data.data.orders),
      'GET /api/v1/admin/customers/:id returns customer details and orders'
    );

    // 2.5 PATCH /api/v1/admin/customers/:id/status (Block and Unblock)
    const resBlock = await request({
      method: 'PATCH',
      path: `/api/v1/admin/customers/${firstCustomer.id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'BLOCKED' },
    });
    assert(resBlock.status === 200 && resBlock.data.data.status === 'BLOCKED', 'PATCH /api/v1/admin/customers/:id/status blocks user');

    const resUnblock = await request({
      method: 'PATCH',
      path: `/api/v1/admin/customers/${firstCustomer.id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'ACTIVE' },
    });
    assert(resUnblock.status === 200 && resUnblock.data.data.status === 'ACTIVE', 'PATCH /api/v1/admin/customers/:id/status restores user to ACTIVE');

    // ==========================================
    // MODULE 3: PRODUCT EXTENSIONS & UPLOAD
    // ==========================================
    console.log('\n--- 3. PRODUCT EXTENSIONS & UPLOAD TESTS ---');

    // 3.1 GET /api/v1/products/check-sku
    const resCheckAvail = await request({
      method: 'GET',
      path: `/api/v1/products/check-sku?sku=RANDOM-UNIQUE-SKU-${Date.now()}`,
    });
    assert(resCheckAvail.status === 200 && resCheckAvail.data.data.isAvailable === true, 'GET /api/v1/products/check-sku indicates unused SKU is available');

    // 3.2 POST /api/v1/products/:id/duplicate
    const resDuplicate = await request({
      method: 'POST',
      path: '/api/v1/products/p001/duplicate',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      resDuplicate.status === 201 &&
        resDuplicate.data.data.id !== 'p001' &&
        resDuplicate.data.data.status === 'DRAFT',
      'POST /api/v1/products/:id/duplicate clones product into a draft'
    );
    const duplicatedId = resDuplicate.data.data.id;

    // 3.3 POST /api/v1/products/bulk-delete
    const resBulkDelete = await request({
      method: 'POST',
      path: '/api/v1/products/bulk-delete',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { ids: [duplicatedId] },
    });
    assert(
      resBulkDelete.status === 200 && resBulkDelete.data.data.deletedCount === 1,
      'POST /api/v1/products/bulk-delete deletes matching products'
    );

    // 3.4 POST /api/v1/upload/image
    const boundary = `----WebKitFormBoundary${Date.now()}`;
    const dummyImageBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
    const multipartBody = buildMultipartBody(boundary, 'image', 'test-pixel.gif', 'image/gif', dummyImageBuffer);

    const resUpload = await request({
      method: 'POST',
      path: '/api/v1/upload/image',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: multipartBody,
    });
    assert(
      resUpload.status === 201 &&
        typeof resUpload.data.data.url === 'string' &&
        (resUpload.data.data.url.startsWith('/uploads/') || resUpload.data.data.url.startsWith('/api/v1/media/')),
      'POST /api/v1/upload/image uploads image file and returns static url'
    );

    // ==========================================
    // MODULE 4: REVIEWS MODERATION (ADMIN)
    // ==========================================
    console.log('\n--- 4. REVIEWS MODERATION TESTS ---');

    // 4.1 GET /api/v1/reviews/admin/all (Forbidden for user)
    const resRevForbidden = await request({
      method: 'GET',
      path: '/api/v1/reviews/admin/all',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(resRevForbidden.status === 403, 'GET /api/v1/reviews/admin/all blocks regular user (403)');

    // 4.2 GET /api/v1/reviews/admin/all (Admin access)
    const resAllReviews = await request({
      method: 'GET',
      path: '/api/v1/reviews/admin/all',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      resAllReviews.status === 200 &&
        Array.isArray(resAllReviews.data.data.items) &&
        resAllReviews.data.data.items.length > 0 &&
        resAllReviews.data.data.items[0].product !== undefined,
      'GET /api/v1/reviews/admin/all returns all system reviews with product info'
    );
    const targetReview = resAllReviews.data.data.items[0];

    // 4.3 GET /api/v1/reviews/admin/stats
    const resRevStats = await request({
      method: 'GET',
      path: '/api/v1/reviews/admin/stats',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      resRevStats.status === 200 &&
        resRevStats.data.data.totalReviews > 0 &&
        resRevStats.data.data.approvedCount >= 0,
      'GET /api/v1/reviews/admin/stats returns summary counts and average rating'
    );

    // 4.4 PATCH /api/v1/reviews/:id/status (Hide review and then re-approve)
    const resHideReview = await request({
      method: 'PATCH',
      path: `/api/v1/reviews/${targetReview.id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'HIDDEN' },
    });
    assert(
      resHideReview.status === 200 && resHideReview.data.data.status === 'HIDDEN',
      'PATCH /api/v1/reviews/:id/status changes review status to HIDDEN'
    );

    const resApproveReview = await request({
      method: 'PATCH',
      path: `/api/v1/reviews/${targetReview.id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'APPROVED' },
    });
    assert(
      resApproveReview.status === 200 && resApproveReview.data.data.status === 'APPROVED',
      'PATCH /api/v1/reviews/:id/status restores review status to APPROVED'
    );
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    console.log(`\n==========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
