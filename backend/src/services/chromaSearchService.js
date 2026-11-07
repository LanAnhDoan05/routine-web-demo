/**
 * chromaSearchService.js
 * Cầu nối Vector Service:
 * - Khi chạy trên Vercel: Dùng trực tiếp vectorEngine.js Native trong Node.js (0ms độ trễ, không cần server Python).
 * - Khi có server Python ngoài (CHROMA_SERVICE_URL): Có thể gọi qua microservice nếu muốn.
 */

const vectorEngine = require('./vectorEngine');

const CHROMA_SERVICE_URL = process.env.CHROMA_SERVICE_URL;

/**
 * Tìm kiếm vector sản phẩm theo từ khóa ngữ nghĩa
 */
async function searchByVector(query, limit = 5) {
  // Nếu có server Python riêng được cấu hình ngoài localhost, thử gọi
  if (CHROMA_SERVICE_URL && !CHROMA_SERVICE_URL.includes('localhost')) {
    try {
      const res = await fetch(`${CHROMA_SERVICE_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`[chromaSearchService] Python service gián đoạn -> Dùng Vector Engine Native.`);
    }
  }

  // Chạy trực tiếp Vector Engine 2 chiều trên Node.js (Vercel-native)
  return await vectorEngine.searchByVector(query, limit);
}

/**
 * Đóng khung AI Stylist với RAG
 */
async function askRAGStylist(keyword, limit = 4) {
  if (CHROMA_SERVICE_URL && !CHROMA_SERVICE_URL.includes('localhost')) {
    try {
      const res = await fetch(`${CHROMA_SERVICE_URL}/rag/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, limit }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`[chromaSearchService] Lỗi gọi Python RAG -> Dùng Vector Engine Native.`);
    }
  }

  // Chạy trực tiếp RAG Grounding Native trên Node.js
  return await vectorEngine.askRAGStylist(keyword, limit);
}

module.exports = {
  searchByVector,
  askRAGStylist,
  getAll2DPoints: vectorEngine.getAll2DPoints,
};
