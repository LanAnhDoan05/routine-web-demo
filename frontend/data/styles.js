// Mock "style" taxonomy used for Style Inspiration, AI Stylist,
// product tagging, and Registration style selection.

export const styles = [
  {
    id: "minimal",
    slug: "minimal",
    name: "Minimal",
    description: "Tối giản, sạch sẽ, ít chi tiết thừa.",
    image: "/images/styles/minimal.jpg",
  },
  {
    id: "smart-casual",
    slug: "smart-casual",
    name: "Smart Casual",
    description: "Lịch sự vừa đủ, vẫn thoải mái để di chuyển cả ngày.",
    image: "/images/styles/smart-casual.jpg",
  },
  {
    id: "streetstyle",
    slug: "streetstyle",
    name: "Streetstyle",
    description: "Cá tính, phóng khoáng, cảm hứng từ đường phố.",
    image: "/images/styles/streetstyle.jpg",
  },
  {
    id: "basic",
    slug: "basic",
    name: "Basic",
    description: "Những món đồ nền tảng, dễ phối với mọi thứ khác.",
    image: "/images/styles/basic.jpg",
  },
  {
    id: "vintage",
    slug: "vintage",
    name: "Vintage",
    description: "Hoài cổ, form dáng rộng rãi và chất liệu mộc mạc.",
    image: "/images/styles/vintage.jpg",
  },
  {
    id: "sporty-chic",
    slug: "sporty-chic",
    name: "Sporty Chic",
    description: "Năng động nhưng vẫn tinh tế, dễ mặc đi tập lẫn đi chơi.",
    image: "/images/styles/sporty-chic.jpg",
  },
];

export function getStyleBySlug(slug) {
  return styles.find((s) => s.slug === slug);
}

export function getStyleById(id) {
  return styles.find((s) => s.id === id);
}

export default styles;
