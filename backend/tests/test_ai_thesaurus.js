/**
 * test_ai_thesaurus.js
 * Kiểm thử khả năng nhận diện chuẩn xác ngôn ngữ tự nhiên tiếng Việt và API /api/v1/ai/chat
 */

const assert = require('assert');
const { normalizeFashionQuery } = require('../src/utils/fashionThesaurus');
const { chatWithStylist } = require('../src/services/aiService');

async function run() {
  console.log('=== KIỂM THỬ CHUẨN HÓA NGÔN NGỮ & AI STYLIST CHAT ===\n');

  // TEST 1: Kiểm thử từ điển fashionThesaurus chuẩn hóa "lớn" -> "oversize", "áo phông" -> "ao-thun", "màu ghi" -> "xám"
  console.log('[TEST 1] Chuẩn hóa câu: "Tìm cho mình áo phông dáng lớn màu ghi dưới 600k":');
  const query1 = 'Tìm cho mình áo phông dáng lớn màu ghi dưới 600k';
  const norm1 = normalizeFashionQuery(query1);

  assert.strictEqual(norm1.fit, 'oversize', 'Từ "lớn/dáng lớn" phải chuẩn hóa thành fit: "oversize"');
  assert.strictEqual(norm1.category, 'ao-thun', 'Từ "áo phông" phải chuẩn hóa thành category: "ao-thun"');
  assert.strictEqual(norm1.color, 'xám', 'Từ "màu ghi" phải chuẩn hóa thành color: "xám"');
  assert.strictEqual(norm1.budget, 600000, 'Ngân sách "dưới 600k" phải là 600,000đ');
  console.log('  -> PASSED: Trích xuất chính xác:', norm1, '\n');

  // TEST 2: Chuẩn hóa câu: "Quần bò ôm chân cho nam đi chơi"
  console.log('[TEST 2] Chuẩn hóa câu: "Quần bò ôm chân cho nam đi chơi":');
  const query2 = 'Quần bò ôm chân cho nam đi chơi';
  const norm2 = normalizeFashionQuery(query2);

  assert.strictEqual(norm2.category, 'quan-jeans', 'Từ "quần bò" phải chuẩn hóa thành category: "quan-jeans"');
  assert.strictEqual(norm2.fit, 'slim-fit', 'Từ "ôm" phải chuẩn hóa thành fit: "slim-fit"');
  assert.strictEqual(norm2.gender, 'men', 'Từ "cho nam" phải chuẩn hóa thành gender: "men"');
  assert.strictEqual(norm2.occasion, 'weekend', 'Từ "đi chơi" phải chuẩn hóa thành occasion: "weekend"');
  console.log('  -> PASSED: Trích xuất chính xác:', norm2, '\n');

  // TEST 3: Kiểm thử hàm chatWithStylist trả về set đồ và lời tư vấn
  console.log('[TEST 3] Gọi chatWithStylist với câu hỏi "áo form to màu đen dạo phố":');
  const chatResult = await chatWithStylist({
    message: 'Mình muốn tìm áo form to màu đen dạo phố cuối tuần',
    history: [],
  });

  assert.ok(chatResult, 'Phải có kết quả trả về');
  assert.ok(chatResult.message && chatResult.message.length > 20, 'Phải có lời tư vấn phong cách');
  assert.ok(chatResult.outfit, 'Phải có outfit');
  assert.ok(Array.isArray(chatResult.products) && chatResult.products.length > 0, 'Phải có sản phẩm trong outfit');
  assert.ok(Array.isArray(chatResult.followUps) && chatResult.followUps.length > 0, 'Phải có câu hỏi gợi ý follow-up');
  console.log('  -> PASSED: Stylist Advice:', chatResult.message.slice(0, 100) + '...');
  console.log('  -> PASSED: Sản phẩm đề xuất:', chatResult.products.map((p) => p.name).join(', '));
  console.log('  -> PASSED: Gợi ý tiếp theo:', chatResult.followUps);

  console.log('\n=== TẤT CẢ TEST ĐỀU VƯỢT QUA THÀNH CÔNG ===');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test thất bại:', err);
  process.exit(1);
});
