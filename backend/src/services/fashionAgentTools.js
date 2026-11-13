const { normalizeFashionQuery } = require('../utils/fashionThesaurus');

const VALID_GENDERS = new Set(['men', 'women', 'unisex']);
const CATEGORY_GROUPS = {
  top: ['top', 'tops', 'ao', 'ao-thun', 'ao-somi', 'ao-polo', 'ao-len', 'ao-ni', 'cat-blazer', 'ao-vest'],
  bottom: ['bottoms', 'quan-jeans', 'quan-tay', 'quan-short', 'quan-kaki', 'vay'],
  outerwear: ['ao-khoac', 'outerwear'],
  accessory: ['accessories', 'phu-kien', 'non-bang-do'],
};
const CATEGORY_NAME_TERMS = {
  'ao-somi': ['shirt', 'so mi'],
  'ao-thun': ['t-shirt', 'tee', 'ao thun', 'ao phong'],
  'ao-polo': ['polo'],
  'ao-len': ['sweater', 'knit', 'cardigan', 'ao len'],
  'ao-ni': ['hoodie', 'sweatshirt', 'ao ni'],
  'quan-jeans': ['jeans', 'jean', 'denim', 'quan bo'],
  'quan-tay': ['trouser', 'dress pant', 'quan tay', 'quan au'],
  'quan-short': ['shorts', 'short', 'quan dui'],
  'quan-kaki': ['khaki', 'kaki', 'chino'],
  'vay': ['skirt', 'dress', 'vay', 'dam'],
  'cat-blazer': ['blazer', 'vest'],
};

function boundedText(value, maxLength = 100) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function boundedInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : undefined;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();
}

function productCategory(product) {
  return String(product.categorySlug || product.categoryId || product.category || '').toLowerCase();
}

function classifyProduct(product) {
  const category = productCategory(product);
  const name = normalizeText(product.name);
  if (CATEGORY_GROUPS.outerwear.some((item) => category.includes(item)) ||
      /\b(ao khoac|jacket|coat|bomber|cardigan|blazer)\b/.test(name)) return 'outerwear';
  if (CATEGORY_GROUPS.bottom.some((item) => category.includes(item)) ||
      /\b(quan|jeans|trouser|pants|skirt|shorts|vay|dam)\b/.test(name)) return 'bottom';
  if (CATEGORY_GROUPS.accessory.some((item) => category.includes(item)) ||
      /\b(bag|belt|hat|sneaker|giay|non|mu|tui|that lung)\b/.test(name)) return 'accessory';
  if (CATEGORY_GROUPS.top.some((item) => category.includes(item)) ||
      /\b(ao|blouse|shirt|tee|polo|sweater|hoodie)\b/.test(name)) return 'top';
  return null;
}

function productMatchesCategory(product, category) {
  if (!category) return true;
  const value = String(category).toLowerCase();
  const parsed = normalizeFashionQuery(value);
  const expected = parsed.category || (Array.isArray(parsed.categories) ? parsed.categories[0] : null);
  const actual = productCategory(product);
  if (expected) {
    if (actual === expected || actual.includes(expected)) return true;
    const categoryTerms = CATEGORY_NAME_TERMS[expected] || [];
    if (['ao', 'tops', 'bottoms', 'cat-jeans'].includes(actual)) {
      const name = normalizeText(product.name);
      if (expected === 'ao-somi' && /\bt[- ]?shirt\b|\btee\b/.test(name)) return false;
      return categoryTerms.some((term) => name.includes(normalizeText(term)));
    }
    if (expected === 'quan-jeans' && actual.includes('jean')) return true;
    return false;
  }
  const slot = Object.keys(CATEGORY_GROUPS).find((key) => CATEGORY_GROUPS[key].includes(value));
  if (slot) return classifyProduct(product) === slot;
  return actual.includes(value);
}

function productColors(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  return [
    ...(Array.isArray(product.colors) ? product.colors : []),
    ...variants.map((variant) => variant.colorName || variant.color).filter(Boolean),
  ];
}

function createFashionToolHandlers({
  productService,
  formatProduct,
  productColorMatches,
  assembleDynamicOutfit,
  message,
  history = [],
  userPreferences,
}) {
  if (!productService || typeof formatProduct !== 'function' ||
      typeof productColorMatches !== 'function' || typeof assembleDynamicOutfit !== 'function') {
    throw new TypeError('Fashion tool dependencies are incomplete');
  }

  async function getAvailableProducts(args = {}) {
    const gender = VALID_GENDERS.has(args.gender) ? args.gender : undefined;
    const priceMin = boundedInteger(args.priceMin);
    const priceMax = boundedInteger(args.priceMax);
    const { items } = await productService.getProducts({
      gender,
      minPrice: priceMin,
      maxPrice: priceMax,
      page: 1,
      limit: 1000,
    });

    const category = boundedText(args.category);
    const keyword = boundedText(args.keyword);
    const normalizedQuery = normalizeFashionQuery(`${category} ${keyword}`.trim());
    const requestedColor = boundedText(args.color) || normalizedQuery.color;
    const requestedFit = boundedText(args.fit) || normalizedQuery.fit;
    const fitTerms = requestedFit === 'oversize'
      ? ['oversize', 'oversized', 'loose', 'baggy', 'form rong', 'dang rong']
      : requestedFit === 'slim-fit'
        ? ['slim', 'slim-fit', 'skinny', 'form om', 'dang om']
        : requestedFit === 'regular'
          ? ['regular', 'classic', 'standard']
          : [];
    const queryTerms = normalizeText(keyword)
      .split(/\s+/)
      .filter((term) => term.length > 2 && !['tim', 'cho', 'minh', 'mot', 'chiec', 'duoi', 'tren'].includes(term));
    const hasStructuredFilter = Boolean(
      category ||
      normalizedQuery.category ||
      requestedColor ||
      requestedFit ||
      priceMin !== undefined ||
      priceMax !== undefined,
    );
    const available = items.filter((product) => {
      if (product.status !== 'ACTIVE' || Number(product.availableStock ?? product.stockQuantity) <= 0) return false;
      if (!productMatchesCategory(product, category || normalizedQuery.category)) return false;
      if (requestedColor && !productColorMatches(productColors(product), requestedColor)) return false;
      if (fitTerms.length > 0) {
        const searchable = normalizeText([
          product.name,
          product.description,
          product.shortDescription,
          ...(product.styles || []),
        ].join(' '));
        if (!fitTerms.some((term) => searchable.includes(normalizeText(term)))) return false;
      }
      if (!hasStructuredFilter && queryTerms.length > 0) {
        const searchable = normalizeText([
          product.name,
          product.description,
          product.shortDescription,
          productCategory(product),
        ].join(' '));
        if (!queryTerms.some((term) => searchable.includes(term))) return false;
      }
      return true;
    });

    return available
      .map((product) => formatProduct(product, {
        color: requestedColor,
        fit: requestedFit,
      }))
      .filter(Boolean);
  }

  function summarizeProduct(product) {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      colors: product.colors,
      sizes: product.sizes,
      stockQuantity: product.stockQuantity,
      image: product.image,
      images: product.images,
    };
  }

  async function getProduct(productId) {
    const id = boundedText(productId, 191);
    if (!id) return null;
    return productService.getProductById(id);
  }

  async function searchProducts(args = {}) {
    const products = await getAvailableProducts(args);
    const limit = Math.min(10, Math.max(1, boundedInteger(args.limit) || 5));
    const results = products.slice(0, limit);
    return {
      count: results.length,
      products: results,
      catalogFacts: results.map(summarizeProduct),
    };
  }

  async function getProductDetails(args = {}) {
    const source = await getProduct(args.productId);
    if (!source) return { found: false, product: null };
    const product = formatProduct(source);
    return {
      found: true,
      product: product || null,
      details: {
        id: source.id,
        name: source.name,
        price: Number(source.price),
        status: source.status,
        availableStock: Number(source.availableStock ?? source.stockQuantity ?? 0),
        category: productCategory(source),
        colors: productColors(source),
        sizes: Array.isArray(source.sizes) ? source.sizes : [],
      },
    };
  }

  async function getAvailableSizes(args = {}) {
    const source = await getProduct(args.productId);
    if (!source) return { found: false, availableSizes: [] };
    const variants = Array.isArray(source.variants) ? source.variants : [];
    if (variants.length > 0) {
      const availableVariants = variants
        .filter((variant) => variant.status !== 'INACTIVE' && Number(variant.stockQuantity) > 0)
        .map((variant) => ({
          size: variant.sizeName || variant.sizeId,
          color: variant.colorName || variant.colorId,
          stockQuantity: Number(variant.stockQuantity),
        }))
        .filter((variant) => variant.size);
      return {
        found: true,
        productId: source.id,
        productName: source.name,
        inventoryByVariant: true,
        availableSizes: availableVariants,
        product: formatProduct(source),
      };
    }

    return {
      found: true,
      productId: source.id,
      productName: source.name,
      inventoryByVariant: false,
      availableSizes: Number(source.availableStock ?? source.stockQuantity) > 0
        ? (Array.isArray(source.sizes) ? source.sizes : [])
        : [],
      note: 'Catalog hiện chỉ có tồn kho tổng của sản phẩm, không có tồn kho riêng cho từng size.',
      product: formatProduct(source),
    };
  }

  async function recommendOutfit(args = {}) {
    const parsed = normalizeFashionQuery(message);
    const intent = {
      ...parsed,
      isAskingForOutfit: true,
      requestType: 'new_outfit',
      gender: VALID_GENDERS.has(args.gender)
        ? args.gender
        : (userPreferences?.gender || parsed.gender || 'unisex'),
      style: boundedText(args.style) || userPreferences?.style || parsed.style,
      occasion: boundedText(args.occasion) || parsed.occasion,
      budget: boundedInteger(args.budget) ?? parsed.budget,
    };
    const requestedCategory = boundedText(args.category);
    if (requestedCategory) {
      const categoryIntent = normalizeFashionQuery(requestedCategory);
      intent.category = categoryIntent.category || requestedCategory.toLowerCase();
      intent.categories = categoryIntent.categories?.length
        ? categoryIntent.categories
        : [intent.category];
    }
    const outfit = await assembleDynamicOutfit(intent, null, message);
    return outfit
      ? { found: true, outfit }
      : { found: false, outfit: null, reason: 'Không tìm thấy đủ sản phẩm đang bán phù hợp tiêu chí trong catalog.' };
  }

  async function replaceOutfitItem(args = {}) {
    const slot = ['top', 'bottom', 'outerwear', 'accessory'].includes(args.replaceType)
      ? args.replaceType
      : null;
    if (!slot) return { replaced: false, reason: 'Loại sản phẩm cần thay không hợp lệ.' };

    const previousMessage = [...history].reverse().find((entry) => (
      entry?.role === 'model' &&
      Array.isArray(entry.productIds) &&
      entry.productIds.some((id) => typeof id === 'string')
    ));
    if (!previousMessage) {
      return { replaced: false, reason: 'Chưa có gợi ý sản phẩm trước đó để thay thế.' };
    }

    const sourceProducts = (await Promise.all(
      [...new Set(previousMessage.productIds.filter((id) => typeof id === 'string'))]
        .map((id) => getProduct(id)),
    )).filter(Boolean);
    const previousProducts = sourceProducts
      .map((product) => ({ source: product, card: formatProduct(product) }))
      .filter((entry) => entry.card);
    const retained = previousProducts.filter((entry) => classifyProduct(entry.source) !== slot);
    const requestedColor = boundedText(args.color);
    const candidates = await getAvailableProducts({
      category: boundedText(args.category),
      color: requestedColor,
      gender: VALID_GENDERS.has(args.gender) && args.gender !== 'unisex' ? args.gender : undefined,
      priceMax: boundedInteger(args.budget),
    });
    const existingIds = new Set(sourceProducts.map((product) => product.id));
    const budget = boundedInteger(args.budget);
    const retainedTotal = retained.reduce((sum, entry) => sum + Number(entry.card.price), 0);
    const replacement = candidates.find((candidate) => (
      !existingIds.has(candidate.id) &&
      classifyProduct(sourceProducts.find((product) => product.id === candidate.id) || {
        category: candidate.category,
        name: candidate.name,
      }) === slot &&
      (!budget || retainedTotal + Number(candidate.price) <= budget)
    ));
    if (!replacement) {
      return { replaced: false, reason: 'Không tìm thấy món thay thế còn hàng, khớp yêu cầu và phù hợp ngân sách.' };
    }

    const products = [...retained.map((entry) => entry.card), replacement];
    const total = products.reduce((sum, product) => sum + Number(product.price), 0);
    const outfit = {
      id: `agent-outfit-${products.map((product) => product.id).join('-')}`,
      title: 'Sản phẩm thay thế từ catalog Routine',
      total,
      products,
    };
    return { replaced: true, slot, outfit };
  }

  async function explainRecommendations(args = {}) {
    const ids = Array.isArray(args.productIds)
      ? [...new Set(args.productIds.filter((id) => typeof id === 'string').slice(0, 10))]
      : [];
    const products = (await Promise.all(ids.map((id) => getProduct(id)))).filter(Boolean);
    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        category: productCategory(product),
        price: Number(product.price),
        colors: productColors(product),
        materials: product.materials || null,
        availableStock: Number(product.availableStock ?? product.stockQuantity ?? 0),
      })),
    };
  }

  const handlers = {
    search_products: searchProducts,
    get_product_details: getProductDetails,
    recommend_outfit: recommendOutfit,
    replace_outfit_item: replaceOutfitItem,
    get_available_sizes: getAvailableSizes,
    get_recommendation_explanation: explainRecommendations,
  };

  return async function executeTool(name, args) {
    const handler = handlers[name];
    if (!handler) throw new Error(`Unknown fashion tool: ${String(name)}`);
    return handler(args);
  };
}

module.exports = { createFashionToolHandlers };
