import { fetchApi } from './api';

/**
 * Lấy danh sách đánh giá của một sản phẩm (Ai cũng có thể xem)
 */
export async function fetchProductReviews(productId, { rating, page = 1, limit = 10 } = {}) {
  const query = new URLSearchParams();
  if (rating) query.set('rating', rating);
  if (page) query.set('page', page);
  if (limit) query.set('limit', limit);

  try {
    const data = await fetchApi(`/reviews/product/${productId}?${query.toString()}`);
    return data || { items: [], summary: { averageRating: 5.0, totalReviews: 0, ratingBreakdown: {} } };
  } catch (err) {
    console.error('[reviewService] fetchProductReviews failed:', err.message);
    return { items: [], summary: { averageRating: 5.0, totalReviews: 0, ratingBreakdown: {} } };
  }
}

/**
 * Gửi đánh giá cho sản phẩm (Bắt buộc phải đăng nhập)
 */
export async function createProductReview(productId, { rating, comment, images = [] }) {
  return await fetchApi(`/reviews/product/${productId}`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment, images }),
  });
}

/**
 * Xóa đánh giá (Chính chủ hoặc Admin)
 */
export async function deleteReview(reviewId) {
  return await fetchApi(`/reviews/${reviewId}`, {
    method: 'DELETE',
  });
}
