// aiStylistService.js
// Calls the backend AI Stylist API powered by Routine's real outfit catalogue and Gemini AI.

import { fetchApi } from "./api";

/**
 * Gửi tin nhắn đàm thoại thời gian thực với AI Stylist (Multi-turn Chat)
 */
export async function sendStylistChatMessage({ message, history = [], currentProductId = null, image = null }) {
  try {
    const res = await fetchApi('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history,
        currentProductId,
        image,
      }),
      timeout: 25000,
    });
    if (res && res.message) {
      return res;
    }
  } catch (err) {
    console.error('[aiStylistService] Chat request failed:', err.message);
    throw err;
  }
}

/**
 * Tương thích ngược với endpoint cũ
 */
export async function generateOutfitRecommendation(preferences = {}) {
  try {
    const res = await fetchApi('/ai/stylist', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
    if (res && res.outfit) {
      return res;
    }
  } catch (err) {
    console.error('[aiStylistService] Recommendation request failed:', err.message);
  }

  // Graceful fallback
  return {
    message: "Dưới đây là gợi ý trang phục phù hợp nhất từ bộ sưu tập Routine.",
    outfit: null,
    products: [],
    total: 0,
  };
}
