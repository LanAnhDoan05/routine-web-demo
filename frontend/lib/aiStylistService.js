// aiStylistService.js
// Calls the backend AI Stylist API powered by Routine's real outfit catalogue and Gemini AI.

import { fetchApi } from "./api";

/**
 * Gửi tin nhắn đàm thoại thời gian thực với AI Stylist (Multi-turn Chat)
 */
export async function sendStylistChatMessage({
  message,
  history = [],
  currentProductId = null,
  image = null,
  conversationId = null,
}) {
  const res = await fetchApi('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      history,
      currentProductId,
      image,
      conversationId,
    }),
    timeout: 25000,
  });
  if (!res || typeof res.message !== 'string') {
    throw new Error('AI Stylist trả về dữ liệu không hợp lệ.');
  }
  return res;
}

/**
 * Tương thích ngược với endpoint cũ
 */
export async function generateOutfitRecommendation(preferences = {}) {
  const res = await fetchApi('/ai/stylist', {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
  if (!res || typeof res.message !== 'string') {
    throw new Error('AI Stylist trả về dữ liệu không hợp lệ.');
  }
  return res;
}
