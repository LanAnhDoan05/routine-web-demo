const subscribers = new Set();

/**
 * Đăng ký nhận bản tin khuyến mãi
 */
async function subscribeNewsletter(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    const error = new Error('Vui lòng cung cấp địa chỉ email hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const normalized = email.trim().toLowerCase();

  if (subscribers.has(normalized)) {
    return {
      email: normalized,
      isNew: false,
      message: 'Email này đã được đăng ký nhận bản tin từ trước',
      welcomeCoupon: 'ROUTINE10',
    };
  }

  subscribers.add(normalized);

  return {
    email: normalized,
    isNew: true,
    message: 'Cảm ơn bạn đã đăng ký nhận tin từ Routine! Mã ưu đãi 10% của bạn là ROUTINE10.',
    welcomeCoupon: 'ROUTINE10',
  };
}

module.exports = {
  subscribeNewsletter,
};
