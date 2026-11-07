/**
 * vectorEngine.js
 * Động cơ Vector 2 Chiều & RAG Grounding Native trên Node.js (Hoạt động 100% trên Vercel)
 * Thay thế hoàn toàn cho server Python ChromaDB cục bộ mà vẫn bảo tồn:
 * 1. Tọa độ điểm 2D (x, y) chuẩn hóa [-10, 10]
 * 2. Tìm kiếm khoảng cách Vector (Euclidean / Cosine similarity)
 * 3. Kỹ thuật "Đóng khung AI" (RAG Grounding) chống bịa đặt sản phẩm
 */

const prisma = require('../config/prisma');
const geminiService = require('./geminiService');

/**
 * Ánh xạ từ khóa của người dùng thành tọa độ mục tiêu (qx, qy) trong không gian 2D
 * Trục X: Mùa vụ / Độ ấm (Thu đông = x âm, Xuân hè = x dương)
 * Trục Y: Kiểu dáng / Danh mục (Quần = y âm, Váy/Công sở = y dương, Casual = y quanh 0)
 */
function projectQueryTo2DVector(query) {
  const q = (query || '').toLowerCase();
  let qx = 0.0;
  let qy = 0.0;

  // Xác định tọa độ X (Mùa vụ & chất liệu)
  if (/len|nỉ|hoodie|khoác|jacket|phao|dạ|gió|ấm|thu đông|sweater|dệt kim/.test(q)) {
    qx = -4.5;
    if (/khoác|jacket|phao|dạ|béo|dày/.test(q)) qx = -6.5;
  } else if (/short|ngắn|cộc|thun|polo|xuân hè|hè|thoáng|mát|linen/.test(q)) {
    qx = 3.5;
    if (/short|ba lỗ|tanktop|đi biển/.test(q)) qx = 5.5;
  }

  // Xác định tọa độ Y (Danh mục & Phom dáng)
  if (/quần|jean|jeans|kaki|trouser|pant|baggy|suông|ống rộng|chinos/.test(q)) {
    qy = -4.0;
    if (/short|ngắn/.test(q)) qy = -2.5;
  } else if (/váy|đầm|skirt|dress|nữ tính/.test(q)) {
    qy = 5.0;
  } else if (/sơ mi|shirt|blazer|vest|suit|công sở|lịch sự|thanh lịch/.test(q)) {
    qy = 3.5;
  } else if (/phông|tee|t-shirt|polo|áo thun/.test(q)) {
    qy = 0.5;
  }

  return { qx, qy };
}

/**
 * 1. Tìm kiếm Vector 2 chiều (Semantic Vector Search)
 */
async function searchByVector(query, limit = 5) {
  const { qx, qy } = projectQueryTo2DVector(query);
  const qLower = (query || '').toLowerCase();

  // Đọc danh sách sản phẩm còn hàng từ MySQL
  const products = await prisma.product.findMany({
    where: { stockQuantity: { gt: 0 } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
      categorySlug: true,
      description: true,
      styles: true,
      vector_x: true,
      vector_y: true,
      category: { select: { name: true } }
    }
  });

  if (!products || products.length === 0) {
    return { query, total_found: 0, products: [] };
  }

  // Tính khoảng cách không gian vector 2D và xếp hạng
  const scored = products.map((p) => {
    const vx = p.vector_x !== null && p.vector_x !== undefined ? Number(p.vector_x) : 0;
    const vy = p.vector_y !== null && p.vector_y !== undefined ? Number(p.vector_y) : 0;

    // Khoảng cách hình học Euclid trong mặt phẳng 2D: dist = sqrt((x1-x2)^2 + (y1-y2)^2)
    let dist = Math.hypot(vx - qx, vy - qy);

    // Thưởng điểm ngữ nghĩa (Keyword Anchor) nếu tên hoặc mô tả khớp từ khóa trực tiếp
    const pText = `${p.name} ${p.categorySlug || ''} ${p.description || ''}`.toLowerCase();
    const queryTokens = qLower.split(/\s+/).filter(Boolean);
    let matchCount = 0;
    for (const t of queryTokens) {
      if (t.length > 1 && pText.includes(t)) matchCount++;
    }
    if (matchCount > 0) {
      dist = Math.max(0.05, dist - (matchCount * 0.8));
    }

    // Quy đổi khoảng cách về % tương đồng (0% -> 100%)
    const maxSpaceDist = 15.0;
    const similarityPct = Math.max(0, Math.min(100, Math.round((1.0 - (dist / maxSpaceDist)) * 100 * 10) / 10));

    // Lấy ảnh đại diện đầu tiên
    let firstImage = '';
    if (p.images) {
      try {
        const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        if (Array.isArray(imgs) && imgs.length > 0) firstImage = imgs[0];
      } catch (e) {}
    }

    const catName = p.category?.name || p.categorySlug || 'Thời trang';

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: firstImage,
      category: catName,
      distance: Number(dist.toFixed(4)),
      similarity: `${similarityPct}%`,
      similarity_score: similarityPct,
      coordinate_2d: { x: vx, y: vy },
      snippet: `Sản phẩm: ${p.name}. Danh mục: ${catName}. Tọa độ 2D: (${vx}, ${vy}). Giá: ${Number(p.price).toLocaleString('vi-VN')} VNĐ.`
    };
  });

  // Sắp xếp theo khoảng cách ngắn nhất (tương đồng cao nhất)
  scored.sort((a, b) => a.distance - b.distance);

  const topResults = scored.slice(0, limit);

  return {
    query,
    total_found: topResults.length,
    products: topResults
  };
}

/**
 * 2. Đóng khung AI Stylist với RAG (Retrieval-Augmented Generation)
 * Bắt AI chỉ được tư vấn dựa trên danh sách sản phẩm trích xuất từ Vector 2D
 */
async function askRAGStylist(keyword, limit = 4) {
  const retrieval = await searchByVector(keyword, limit);
  const matchedProducts = retrieval.products || [];

  if (matchedProducts.length === 0) {
    return {
      user_query: keyword,
      ai_response: "Hiện tại kho Routine chưa tìm thấy sản phẩm nào có tọa độ vector tương đồng với yêu cầu của bạn. Bạn hãy thử các từ khóa như 'áo len thu đông', 'quần jeans ống suông' nhé!",
      grounded_products: []
    };
  }

  // Đóng khung danh sách sản phẩm vào Prompt
  const contextLines = matchedProducts.map((p, idx) => 
    `${idx + 1}. ${p.name} | Danh mục: ${p.category} | Giá: ${Number(p.price).toLocaleString('vi-VN')} VNĐ | Độ tương đồng vector: ${p.similarity} | Tọa độ 2D: (${p.coordinate_2d.x}, ${p.coordinate_2d.y})`
  );
  const contextStr = contextLines.join('\n');

  const systemInstruction = `Bạn là Chuyên viên Thời trang Độc quyền của thương hiệu Routine (AI Stylist).

ĐÂY LÀ QUY TẮC ĐÓNG KHUNG BẮT BUỘC (RAG GROUNDING):
- Bạn CHỈ ĐƯỢC PHÉP tư vấn và gợi ý những sản phẩm NẰM TRONG DANH SÁCH DƯỚI ĐÂY (dữ liệu được trích xuất từ không gian Vector 2D của Routine).
- TUYỆT ĐỐI KHÔNG tự bịa hoặc gợi ý sản phẩm không có trong danh sách này.
- Hãy giải thích lý do vì sao những món đồ này phù hợp với yêu cầu của khách hàng dựa trên kiểu dáng, chất liệu, màu sắc và phom dáng.
- Trình bày lịch sự, tinh tế, đúng phong cách tối giản (Minimalism) của Routine.`;

  const userPrompt = `DANH SÁCH SẢN PHẨM KHỚP TỌA ĐỘ TỪ KHO ROUTINE (VECTOR 2D):
${contextStr}

YÊU CẦU CỦA KHÁCH HÀNG:
"${keyword}"

Hãy viết lời tư vấn cụ thể và súc tích (1-2 đoạn), nêu rõ tên và giá của từng món đồ được gợi ý:`;

  let aiResponseText = '';

  const generatedText = await geminiService.generateContent({
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction,
    temperature: 0.7,
    maxOutputTokens: 600,
  });
  if (generatedText) {
    aiResponseText = generatedText;
  }

  // Fallback nếu không có API key hoặc Gemini API bận
  if (!aiResponseText) {
    const pNames = matchedProducts.map(p => `"${p.name}" (${Number(p.price).toLocaleString('vi-VN')}đ)`).join(', ');
    aiResponseText = `Dạ chào bạn! Dựa trên không gian vector tọa độ thời trang Routine, mình đã chọn ra các sản phẩm ăn ý nhất với mong muốn của bạn: ${pNames}. Những món đồ này sở hữu chất liệu chọn lọc, đường may tinh tế và phom dáng chuẩn, rất thích hợp cho phong cách hiện đại thường ngày.`;
  }

  return {
    user_query: keyword,
    ai_response: aiResponseText,
    grounded_products: matchedProducts,
    grounding_mode: 'vector_2d_native'
  };
}

/**
 * 3. Lấy toàn bộ danh sách điểm 2D phục vụ vẽ biểu đồ Visualizer
 */
async function getAll2DPoints() {
  const products = await prisma.product.findMany({
    where: { stockQuantity: { gt: 0 } },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      categorySlug: true,
      vector_x: true,
      vector_y: true,
      category: { select: { name: true } }
    }
  });

  return products.map(p => {
    let firstImage = '';
    if (p.images) {
      try {
        const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        if (Array.isArray(imgs) && imgs.length > 0) firstImage = imgs[0];
      } catch (e) {}
    }
    return {
      id: p.id,
      name: p.name,
      category: p.category?.name || p.categorySlug || 'Routine',
      price: p.price,
      image: firstImage,
      x: Number(p.vector_x || 0),
      y: Number(p.vector_y || 0)
    };
  });
}

module.exports = {
  projectQueryTo2DVector,
  searchByVector,
  askRAGStylist,
  getAll2DPoints
};
