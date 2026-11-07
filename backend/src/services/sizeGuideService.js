/**
 * sizeGuideService.js
 * Dịch vụ quản lý bảng kích cỡ (size_guides) và thuật toán tư vấn size theo Chiều cao & Cân nặng
 */

const prisma = require('../config/prisma');

const DEFAULT_SIZE_GUIDES = [
  { size: 'XS', minHeight: 150, maxHeight: 158, minWeight: 42, maxWeight: 50, order: 1 },
  { size: 'S', minHeight: 158, maxHeight: 165, minWeight: 50, maxWeight: 58, order: 2 },
  { size: 'M', minHeight: 165, maxHeight: 172, minWeight: 58, maxWeight: 66, order: 3 },
  { size: 'L', minHeight: 170, maxHeight: 178, minWeight: 66, maxWeight: 74, order: 4 },
  { size: 'XL', minHeight: 175, maxHeight: 183, minWeight: 74, maxWeight: 82, order: 5 },
  { size: 'XXL', minHeight: 180, maxHeight: 192, minWeight: 82, maxWeight: 95, order: 6 },
];

let isInitialized = false;

/**
 * Đảm bảo bảng size_guides tồn tại và có đầy đủ 6 kích cỡ chuẩn (XS -> XXL)
 */
async function ensureSizeGuideData() {
  if (isInitialized) return;

  try {
    // 1. Tạo bảng nếu chưa tồn tại
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS size_guides (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        size VARCHAR(20) NOT NULL UNIQUE,
        min_height INT NOT NULL,
        max_height INT NOT NULL,
        min_weight INT NOT NULL,
        max_weight INT NOT NULL,
        \`order\` INT NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // 2. Kiểm tra xem đã có dữ liệu chưa
    const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM size_guides`);
    const count = Number(countResult[0]?.cnt || 0);

    if (count < 6) {
      for (const item of DEFAULT_SIZE_GUIDES) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO size_guides (id, size, min_height, max_height, min_weight, max_weight, \`order\`, created_at, updated_at)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             min_height = VALUES(min_height),
             max_height = VALUES(max_height),
             min_weight = VALUES(min_weight),
             max_weight = VALUES(max_weight),
             \`order\` = VALUES(\`order\`);`,
          item.size,
          item.minHeight,
          item.maxHeight,
          item.minWeight,
          item.maxWeight,
          item.order
        );
      }
    }

    isInitialized = true;
  } catch (err) {
    console.warn('[sizeGuideService] ensureSizeGuideData error:', err.message);
  }
}

/**
 * Lấy toàn bộ danh sách bảng size từ cơ sở dữ liệu
 */
async function getSizeGuides() {
  await ensureSizeGuideData();
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT id, size, min_height AS minHeight, max_height AS maxHeight, min_weight AS minWeight, max_weight AS maxWeight, \`order\`
      FROM size_guides
      ORDER BY \`order\` ASC
    `);
    return rows.map((r) => ({
      id: r.id,
      size: r.size,
      minHeight: Number(r.minHeight),
      maxHeight: Number(r.maxHeight),
      minWeight: Number(r.minWeight),
      maxWeight: Number(r.maxWeight),
      order: Number(r.order),
    }));
  } catch (err) {
    console.warn('[sizeGuideService] Fallback to default size guides:', err.message);
    return DEFAULT_SIZE_GUIDES;
  }
}

/**
 * Thuật toán truy xuất CSDL và tính toán tư vấn kích cỡ
 * @param {Object} params
 * @param {number|null} params.height - Chiều cao (cm)
 * @param {number|null} params.weight - Cân nặng (kg)
 * @param {string|null} params.fitPreference - Sở thích mặc ('oversize', 'slim-fit', 'regular')
 */
async function recommendSize({ height = null, weight = null, fitPreference = null }) {
  const sizeGuides = await getSizeGuides();

  if (!height && !weight) {
    return null;
  }

  // Nếu chỉ có chiều cao
  if (height && !weight) {
    const matchedByHeight = sizeGuides.filter(
      (s) => height >= s.minHeight && height <= s.maxHeight
    );
    const chosen = matchedByHeight.length > 0
      ? matchedByHeight[0]
      : (height < sizeGuides[0].minHeight ? sizeGuides[0] : sizeGuides[sizeGuides.length - 1]);

    return {
      size: chosen.size,
      alternativeSize: null,
      height,
      weight: null,
      confidence: 'medium',
      reason: `Với chiều cao ${height}cm, bạn phù hợp với size ${chosen.size} (khoảng ${chosen.minHeight} - ${chosen.maxHeight}cm). Để tư vấn chuẩn xác 100%, bạn có thể cho Routine biết thêm cân nặng của mình nhé!`,
      details: chosen,
    };
  }

  // Nếu chỉ có cân nặng
  if (!height && weight) {
    const matchedByWeight = sizeGuides.filter(
      (s) => weight >= s.minWeight && weight <= s.maxWeight
    );
    const chosen = matchedByWeight.length > 0
      ? matchedByWeight[0]
      : (weight < sizeGuides[0].minWeight ? sizeGuides[0] : sizeGuides[sizeGuides.length - 1]);

    return {
      size: chosen.size,
      alternativeSize: null,
      height: null,
      weight,
      confidence: 'medium',
      reason: `Với cân nặng ${weight}kg, bạn phù hợp với size ${chosen.size} (khoảng ${chosen.minWeight} - ${chosen.maxWeight}kg). Để tư vấn chuẩn xác tuyệt đối, bạn hãy chia sẻ thêm chiều cao của mình nhé!`,
      details: chosen,
    };
  }

  // Có cả CHIỀU CAO VÀ CÂN NẶNG: Truy xuất CSDL để so khớp
  // 1. Tìm các size khớp cả chiều cao và cân nặng trong khoảng min - max
  const exactMatches = sizeGuides.filter(
    (s) =>
      height >= s.minHeight &&
      height <= s.maxHeight &&
      weight >= s.minWeight &&
      weight <= s.maxWeight
  );

  if (exactMatches.length > 0) {
    const match = exactMatches[0];
    let note = `Với số đo chiều cao ${height}cm và cân nặng ${weight}kg, số đo của bạn hoàn toàn chuẩn khớp với **Size ${match.size}** (Chiều cao ${match.minHeight}-${match.maxHeight}cm, Cân nặng ${match.minWeight}-${match.maxWeight}kg).`;
    
    if (fitPreference === 'oversize') {
      const nextIndex = sizeGuides.findIndex((s) => s.size === match.size) + 1;
      const upSize = sizeGuides[nextIndex]?.size;
      if (upSize) {
        note += ` Vì bạn thích mặc form rộng rãi (oversize), bạn có thể cân nhắc lên **Size ${upSize}** để có độ rủ thoải mái hơn nhé!`;
      }
    } else if (fitPreference === 'slim-fit') {
      note += ` Mặc size ${match.size} sẽ giúp bạn tôn dáng vừa vặn và thanh lịch nhất.`;
    }

    return {
      size: match.size,
      alternativeSize: fitPreference === 'oversize' ? (sizeGuides[sizeGuides.findIndex((s) => s.size === match.size) + 1]?.size || null) : null,
      height,
      weight,
      confidence: 'high',
      reason: note,
      details: match,
    };
  }

  // 2. Nếu không có khoảng min - max giao thoa hoàn hảo (ví dụ: người cao gầy hoặc đậm người)
  // Tìm size theo chiều cao và size theo cân nặng
  let heightSize = sizeGuides.find((s) => height >= s.minHeight && height <= s.maxHeight);
  if (!heightSize) {
    heightSize = height < sizeGuides[0].minHeight ? sizeGuides[0] : sizeGuides[sizeGuides.length - 1];
  }

  let weightSize = sizeGuides.find((s) => weight >= s.minWeight && weight <= s.maxWeight);
  if (!weightSize) {
    weightSize = weight < sizeGuides[0].minWeight ? sizeGuides[0] : sizeGuides[sizeGuides.length - 1];
  }

  // Đánh giá dựa trên thứ tự size
  const heightOrder = heightSize.order;
  const weightOrder = weightSize.order;

  let recommendedSize = null;
  let secondarySize = null;
  let explanation = '';

  if (weightOrder > heightOrder) {
    // Đậm người: ưu tiên size theo cân nặng để vòng ngực, vai và bụng thoải mái
    recommendedSize = weightSize.size;
    secondarySize = heightSize.size;
    explanation = `Với chiều cao ${height}cm và cân nặng ${weight}kg, vóc dáng của bạn đậm người. Routine khuyên bạn nên chọn **Size ${recommendedSize}** để phần ngực, vai và bụng được thoải mái, không bị bó sát. Nếu thích mặc ôm gọn thì có thể cân nhắc size ${secondarySize}.`;
  } else if (heightOrder > weightOrder) {
    // Cao gầy: cân nhắc giữa chiều dài áo/quần và độ rộng
    recommendedSize = heightSize.size;
    secondarySize = weightSize.size;
    explanation = `Với chiều cao ${height}cm và cân nặng ${weight}kg, bạn có vóc dáng cao thanh mảnh. Routine tư vấn bạn nên chọn **Size ${recommendedSize}** để áo và quần có chiều dài vừa vặn không bị ngắn. Bạn có thể chọn các thiết kế Regular hoặc form suông để tôn dáng chuẩn nhất nhé!`;
  } else {
    recommendedSize = heightSize.size;
    explanation = `Với chiều cao ${height}cm và cân nặng ${weight}kg, kích cỡ tối ưu nhất cho bạn là **Size ${recommendedSize}** theo bảng size chuẩn Routine.`;
  }

  if (fitPreference === 'oversize' && recommendedSize !== 'XXL') {
    const nextIdx = sizeGuides.findIndex((s) => s.size === recommendedSize) + 1;
    if (sizeGuides[nextIdx]) {
      secondarySize = sizeGuides[nextIdx].size;
      explanation += ` Bạn thích form rộng thoải mái nên cũng có thể tham khảo thêm size **${secondarySize}**.`;
    }
  }

  return {
    size: recommendedSize,
    alternativeSize: secondarySize,
    height,
    weight,
    confidence: 'high',
    reason: explanation,
    details: {
      heightSize: heightSize.size,
      weightSize: weightSize.size,
    },
  };
}

module.exports = {
  DEFAULT_SIZE_GUIDES,
  ensureSizeGuideData,
  getSizeGuides,
  recommendSize,
};
