const test = require('node:test');
const assert = require('node:assert/strict');
const uploadController = require('../src/controllers/uploadController');

function filter(file) {
  return new Promise((resolve, reject) => {
    uploadController.fileFilter(null, file, (error, accepted) => {
      if (error) reject(error);
      else resolve(accepted);
    });
  });
}

test('accepts supported image MIME types with matching extensions', async () => {
  for (const [mimetype, originalname] of [
    ['image/jpeg', 'product.jpg'],
    ['image/jpeg', 'product.jpeg'],
    ['image/png', 'product.png'],
    ['image/webp', 'product.webp'],
  ]) {
    assert.equal(await filter({ mimetype, originalname }), true);
  }
});

test('rejects unsupported image types and mismatched extensions', async () => {
  for (const [mimetype, originalname] of [
    ['image/svg+xml', 'product.svg'],
    ['image/gif', 'product.gif'],
    ['image/jpeg', 'product.png'],
    ['image/png', 'product.jpg'],
  ]) {
    await assert.rejects(filter({ mimetype, originalname }), {
      message: 'Chỉ chấp nhận file ảnh JPG, JPEG, PNG hoặc WEBP',
      statusCode: 400,
    });
  }
});

test('caps uploaded image files at 4MB', () => {
  assert.equal(uploadController.MAX_IMAGE_SIZE_BYTES, 4 * 1024 * 1024);
});
