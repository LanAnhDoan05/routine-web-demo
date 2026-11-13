const PRODUCT_INTEREST_PATTERNS = [
  /\b(áo|quần|váy|đầm|polo|jeans|jean|sơ mi|sản phẩm|mẫu)\b/i,
  /\b(tìm|chọn|quan tâm|xem|gợi ý|tư vấn)\b/i,
];

const COMPARISON_PATTERNS = [
  /\b(so sánh|so với|khác nhau|khác biệt|phân biệt|nên chọn|cái nào|mẫu nào)\b/i,
  /\b(hơn|thay thế|đổi sang|đổi mẫu|còn mẫu)\b/i,
  /\b(giữa .+ và .+|vs\.?|versus)\b/i,
];

const TRANSACTION_SIGNALS = [
  { pattern: /\b(mua|đặt hàng|đặt mua|chốt đơn|thanh toán|checkout)\b/i, points: 15, label: 'Khách nhắc đến mua hoặc thanh toán' },
  { pattern: /\b(thêm vào giỏ|giỏ hàng|đặt ngay|đặt luôn|lấy .{0,30}(?:cái|chiếc|bộ))\b/i, points: 10, label: 'Khách thể hiện mong muốn thêm sản phẩm hoặc đặt ngay' },
  { pattern: /\b(giao hàng|phí ship|vận chuyển|nhận hàng|địa chỉ giao)\b/i, points: 6, label: 'Khách hỏi về giao nhận' },
  { pattern: /\b(hôm nay|ngay bây giờ|sớm nhất|còn hàng|còn không)\b/i, points: 4, label: 'Khách hỏi khả năng mua hoặc thời điểm nhận hàng' },
];

const SPECIFIC_NEED_SIGNALS = [
  { pattern: /\b(áo|quần|váy|đầm|polo|jeans|jean|sơ mi)\b/i, label: 'đã nêu loại sản phẩm' },
  { pattern: /\b(size|kích cỡ|cỡ)\s*([a-z]{1,3}|\d{1,2})?\b/i, label: 'đã nêu size' },
  { pattern: /\b(màu|đen|trắng|xám|be|nâu|xanh|đỏ|rêu)\b/i, label: 'đã nêu màu sắc' },
  { pattern: /\b(ngân sách|dưới|khoảng|tầm|triệu|nghìn|k)\b/i, label: 'đã nêu ngân sách' },
  { pattern: /\b(công sở|đi làm|dạo phố|hẹn hò|du lịch|dự tiệc|đám cưới)\b/i, label: 'đã nêu dịp sử dụng' },
];

function classifyPurchaseIntent(score) {
  if (score >= 80) return 'VERY_HIGH';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

function matches(pattern, text) {
  const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
  const normalizedPattern = new RegExp(normalize(pattern.source), pattern.flags);
  return normalizedPattern.test(normalize(text));
}

function scorePurchaseIntent(messages = []) {
  const customerMessages = messages
    .filter((message) => message?.role === 'CUSTOMER' && typeof message.text === 'string')
    .map((message) => message.text.trim())
    .filter(Boolean);
  const transcript = customerMessages.join('\n').toLowerCase();

  const interestMatches = PRODUCT_INTEREST_PATTERNS.filter((pattern) => matches(pattern, transcript)).length;
  const comparisonMatches = COMPARISON_PATTERNS.filter((pattern) => matches(pattern, transcript)).length;
  const transactionMatches = TRANSACTION_SIGNALS.filter((signal) => matches(signal.pattern, transcript));
  const specificMatches = SPECIFIC_NEED_SIGNALS.filter((signal) => matches(signal.pattern, transcript));

  const breakdown = {
    productInterest: Math.min(20, interestMatches * 10),
    comparison: Math.min(25, comparisonMatches * 9),
    transaction: Math.min(35, transactionMatches.reduce((sum, signal) => sum + signal.points, 0)),
    specificNeed: Math.min(20, specificMatches.length * 4),
  };
  const score = Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  const signals = [
    ...transactionMatches.map((signal) => signal.label),
    ...specificMatches.map((signal) => signal.label),
  ];

  return {
    userMessageCount: customerMessages.length,
    score,
    level: classifyPurchaseIntent(score),
    breakdown,
    signals,
    reason: signals.length
      ? signals.join('; ')
      : 'Chưa có tín hiệu mua hàng cụ thể trong tin nhắn khách hàng.',
  };
}

module.exports = {
  classifyPurchaseIntent,
  scorePurchaseIntent,
};
