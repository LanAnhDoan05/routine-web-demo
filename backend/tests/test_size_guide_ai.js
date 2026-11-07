/**
 * test_size_guide_ai.js
 * Kiểm thử toàn diện tính năng tư vấn kích cỡ (Size Consultation: XS -> XXL)
 * theo Chiều cao & Cân nặng trong Cơ sở dữ liệu và AI Stylist
 */

const prisma = require('../src/config/prisma');
const sizeGuideService = require('../src/services/sizeGuideService');
const aiService = require('../src/services/aiService');
const { extractHeightAndWeight } = require('../src/utils/fashionThesaurus');

async function runTests() {
  console.log('====================================================');
  console.log('BẮT ĐẦU KIỂM THỬ TÍNH NĂNG TƯ VẤN SIZE CHO AI STYLIST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Bảng CSDL size_guides và 6 kích cỡ (XS - XXL)
    // ----------------------------------------------------
    console.log('1. Kiểm tra CSDL size_guides và 6 kích cỡ chuẩn:');
    await sizeGuideService.ensureSizeGuideData();
    const sizeGuides = await sizeGuideService.getSizeGuides();

    assert(Array.isArray(sizeGuides), 'getSizeGuides trả về mảng');
    assert(sizeGuides.length === 6, `Bảng size_guides có đúng 6 kích cỡ (hiện có: ${sizeGuides.length})`);

    const expectedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const dbSizes = sizeGuides.map((s) => s.size);
    assert(
      JSON.stringify(dbSizes) === JSON.stringify(expectedSizes),
      `Các size lần lượt là: ${expectedSizes.join(', ')}`
    );

    // Kiểm tra 4 cột min_height, max_height, min_weight, max_weight
    const allHaveCols = sizeGuides.every(
      (s) =>
        typeof s.minHeight === 'number' &&
        typeof s.maxHeight === 'number' &&
        typeof s.minWeight === 'number' &&
        typeof s.maxWeight === 'number' &&
        s.minHeight < s.maxHeight &&
        s.minWeight < s.maxWeight
    );
    assert(allHaveCols, 'Tất cả 6 size đều có đủ 4 cột min_height, max_height, min_weight, max_weight hợp lệ');

    // ----------------------------------------------------
    // TEST 2: Trích xuất Chiều cao & Cân nặng (NLP Tiếng Việt)
    // ----------------------------------------------------
    console.log('\n2. Kiểm tra bộ trích xuất NLP Chiều cao & Cân nặng:');
    const nlpTests = [
      { text: 'mình cao 1m70 nặng 65kg', expH: 170, expW: 65 },
      { text: 'cao 1m75 nặng 68 cân', expH: 175, expW: 68 },
      { text: 'cao 1m68, 52 ký tư vấn size giúp mình', expH: 168, expW: 52 },
      { text: '1m7 60kg', expH: 170, expW: 60 },
      { text: '1m65 55kg mặc size nào', expH: 165, expW: 55 },
      { text: 'm72 65kg', expH: 172, expW: 65 },
      { text: 'm80 85kg', expH: 180, expW: 85 },
      { text: '1m72 65', expH: 172, expW: 65 },
      { text: 'cao 175cm nặng 70 kg', expH: 175, expW: 70 },
      { text: '1.78m 72kg', expH: 178, expW: 72 },
      { text: '1,70m 62kg', expH: 170, expW: 62 },
      { text: 'nặng 65kg cao 1m72', expH: 172, expW: 65 },
    ];

    for (const item of nlpTests) {
      const res = extractHeightAndWeight(item.text);
      assert(
        res.height === item.expH && res.weight === item.expW && res.isAskingForSize,
        `"${item.text}" => Chiều cao: ${res.height}cm (kỳ vọng ${item.expH}), Cân nặng: ${res.weight}kg (kỳ vọng ${item.expW})`
      );
    }

    // ----------------------------------------------------
    // TEST 3: Thuật toán tra cứu 6 kích cỡ XS -> XXL qua CSDL
    // ----------------------------------------------------
    console.log('\n3. Kiểm tra khớp đúng 6 size (XS, S, M, L, XL, XXL) với min - max:');
    const sizeMatchCases = [
      { h: 155, w: 45, expected: 'XS' },
      { h: 162, w: 53, expected: 'S' },
      { h: 170, w: 62, expected: 'M' },
      { h: 175, w: 70, expected: 'L' },
      { h: 180, w: 78, expected: 'XL' },
      { h: 185, w: 88, expected: 'XXL' },
    ];

    for (const c of sizeMatchCases) {
      const rec = await sizeGuideService.recommendSize({ height: c.h, weight: c.w });
      assert(
        rec.size === c.expected,
        `${c.h}cm & ${c.w}kg => Khớp chính xác Size ${rec.size} (Kỳ vọng: ${c.expected})`
      );
    }

    // ----------------------------------------------------
    // TEST 4: Chat với AI Stylist - Tư vấn kích cỡ đầy đủ
    // ----------------------------------------------------
    console.log('\n4. Kiểm tra chat AI Stylist với 6 size khác nhau:');
    for (const c of sizeMatchCases) {
      const chatRes = await aiService.chatWithStylist({
        message: `mình cao ${c.h}cm nặng ${c.w}kg tư vấn size giúp mình`,
      });
      assert(
        chatRes.sizeRecommendation?.size === c.expected,
        `AI Stylist trả về sizeRecommendation.size = ${chatRes.sizeRecommendation?.size} cho ${c.h}cm/${c.w}kg`
      );
      assert(
        chatRes.message.includes(c.expected),
        `Câu trả lời của AI Stylist có chứa kích cỡ đề xuất "${c.expected}"`
      );
    }

    // ----------------------------------------------------
    // TEST 5: Các trường hợp đặc biệt & Khuyết thông số
    // ----------------------------------------------------
    console.log('\n5. Kiểm tra trường hợp chỉ cung cấp chiều cao hoặc chỉ cung cấp cân nặng:');
    // Chỉ có chiều cao
    const heightOnlyRes = await aiService.chatWithStylist({
      message: 'mình cao 1m75 tư vấn chọn size',
    });
    assert(
      heightOnlyRes.sizeRecommendation?.size === 'L',
      'Chỉ cao 1m75 => Gợi ý Size L theo chiều cao'
    );
    assert(
      heightOnlyRes.message.toLowerCase().includes('cân nặng') || heightOnlyRes.message.toLowerCase().includes('kg'),
      'AI Stylist khéo léo hỏi thêm cân nặng để tư vấn chuẩn xác'
    );

    // Chỉ có cân nặng
    const weightOnlyRes = await aiService.chatWithStylist({
      message: 'mình nặng 62kg mặc size gì',
    });
    assert(
      weightOnlyRes.sizeRecommendation?.size === 'M',
      'Chỉ nặng 62kg => Gợi ý Size M theo cân nặng'
    );
    assert(
      weightOnlyRes.message.toLowerCase().includes('chiều cao') || weightOnlyRes.message.toLowerCase().includes('cm') || weightOnlyRes.message.toLowerCase().includes('m'),
      'AI Stylist khéo léo hỏi thêm chiều cao để tư vấn chuẩn xác'
    );

    // Hỏi size mà không có số đo
    const noMetricRes = await aiService.chatWithStylist({
      message: 'tư vấn size cho mình với shop',
    });
    assert(
      noMetricRes.message.includes('XS') && noMetricRes.message.includes('XXL'),
      'AI Stylist thông báo về 6 kích cỡ XS - XXL và hướng dẫn gửi số đo'
    );

    // ----------------------------------------------------
    // TEST 6: Kết hợp vừa tư vấn size vừa gợi ý sản phẩm
    // ----------------------------------------------------
    console.log('\n6. Kiểm tra kết hợp tư vấn size và gợi ý sản phẩm:');
    const comboRes = await aiService.chatWithStylist({
      message: 'mình cao 1m75 nặng 70kg cần tư vấn áo polo dạo phố',
    });

    assert(
      comboRes.sizeRecommendation?.size === 'L',
      'Tư vấn Size L chuẩn xác cho 1m75 70kg'
    );
    assert(
      comboRes.products && comboRes.products.length > 0,
      'Gợi ý set đồ thành công'
    );
    // Sản phẩm gợi ý đã được tự động gán selectedSize = 'L'
    const topItem = comboRes.products[0];
    assert(
      topItem && topItem.selectedSize === 'L',
      `Sản phẩm gợi ý "${topItem?.name}" đã tự động chọn Size: ${topItem?.selectedSize}`
    );

    console.log('\n====================================================');
    console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Lỗi nghiêm trọng khi chạy kiểm thử:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
