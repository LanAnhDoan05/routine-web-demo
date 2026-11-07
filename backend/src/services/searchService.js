const prisma = require('../config/prisma');

const TRENDING_KEYWORDS = [
  'Áo thun',
  'Áo sơ mi',
  'Quần jeans',
  'Quần tây',
  'Áo polo',
  'Áo khoác',
  'Chân váy',
  'Smart Casual',
  'Minimalist',
  'Denim',
];

async function getSuggestions(q) {
  if (!q || typeof q !== 'string' || !q.trim()) {
    return {
      products: [],
      categories: [],
      keywords: TRENDING_KEYWORDS.slice(0, 5),
    };
  }

  const keyword = q.trim();

  const [dbProducts, dbCategories] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
          { slug: { contains: keyword } },
        ],
      },
      take: 6,
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { slug: { contains: keyword } },
        ],
      },
      take: 4,
    }),
  ]);

  const matchedProducts = dbProducts.map((p) => {
    let img = '';
    if (Array.isArray(p.images)) {
      img = p.images[0] || '';
    } else if (typeof p.images === 'string') {
      try {
        const parsed = JSON.parse(p.images);
        img = Array.isArray(parsed) ? parsed[0] : p.images;
      } catch {
        img = p.images;
      }
    }
    return {
      id: p.id,
      name: p.name,
      category: p.categorySlug || p.categoryId,
      price: p.price,
      image: img,
    };
  });

  const matchedCategories = dbCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    image: c.image || '',
  }));

  return {
    query: q,
    products: matchedProducts,
    categories: matchedCategories,
    totalResults: matchedProducts.length + matchedCategories.length,
  };
}

async function getTrendingKeywords() {
  return TRENDING_KEYWORDS;
}

module.exports = {
  getSuggestions,
  getTrendingKeywords,
};
