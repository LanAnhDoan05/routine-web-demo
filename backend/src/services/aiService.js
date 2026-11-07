/**
 * Dịch vụ AI Fashion Stylist Thông minh Thế hệ Mới - Routine
 * Tích hợp Google Gemini AI + Chuẩn hóa Ngữ nghĩa Thời trang (Thesaurus) + Dynamic Outfit Pairing
 */

const prisma = require('../config/prisma');
const outfitService = require('./outfitService');
const sizeGuideService = require('./sizeGuideService');
const vectorEngine = require('./vectorEngine');
const geminiService = require('./geminiService');
const { normalizeFashionQuery } = require('../utils/fashionThesaurus');

async function callGeminiApi(options) {
  return geminiService.generateContent(options);
}

/**
 * Phân tích chuỗi JSON an toàn từ kết quả của LLM
 */
function safeJsonParse(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  cleaned = cleaned.replace(/\/\/.*$/gm, '');
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const target = jsonMatch ? jsonMatch[0] : cleaned;
  try {
    return JSON.parse(target);
  } catch (e1) {
    try {
      const fixed = target.replace(/([^\\])\n/g, '$1\\n');
      return JSON.parse(fixed);
    } catch (e2) {
      return null;
    }
  }
}

/**
 * Kiểm tra xem tin nhắn người dùng có phải là lời chào hỏi / nói chuyện thông thường không
 */
function isGreetingOrGeneralChat(text) {
  if (!text || typeof text !== 'string') return true;
  const lower = text.trim().toLowerCase();

  const pureGreetings = [
    'chào', 'chao', 'xin chào', 'xin chao', 'hello', 'hi', 'hey', 'alo', 'hế lô', 'he lo',
    'chào bạn', 'chao ban', 'chào em', 'chao em', 'chào shop', 'chao shop',
    'bạn là ai', 'ban la ai', 'em là ai', 'em la ai', 'routine ơi', 'routine oi',
    'tư vấn giúp tôi', 'tu van giup toi', 'giúp tôi với', 'giup toi voi',
    'bắt đầu', 'bat dau', 'help', 'hi bạn', 'hi ban', 'chào nhé', 'chào ad'
  ];

  if (pureGreetings.includes(lower)) return true;

  const fashionKeywords = [
    'áo', 'ao', 'quần', 'quan', 'váy', 'vay', 'đầm', 'dam', 'polo', 'jean', 'set', 'outfit',
    'phối', 'mặc', 'công sở', 'tiệc', 'hẹn hò', 'dạo phố', 'khoác', 'blazer', 'hoodie', 'short',
    'mua', 'tìm', 'chọn', 'size', 'màu', 'form', 'rộng', 'ôm', 'lớn', 'đổi', 'thay'
  ];

  const startsWithGreeting = pureGreetings.some((g) => lower.startsWith(g + ' ') || lower.startsWith(g + ','));
  const hasFashion = fashionKeywords.some((kw) => lower.includes(kw));

  if (startsWithGreeting && !hasFashion) return true;
  if (lower.includes('bạn là ai') || lower.includes('bạn có thể làm gì') || lower.includes('chức năng của bạn')) return true;

  return false;
}

/**
 * Phân tích và chuẩn hóa ý định người dùng (Intent Extraction)
 * Kết hợp Gemini AI (gemini-3.6-flash) với từ điển fashionThesaurus và ngữ cảnh đa lượt
 */
async function extractFashionIntent(userMessage, history = []) {
  const isGreeting = isGreetingOrGeneralChat(userMessage);

  // 1. Phân tích nền bằng từ điển chuẩn hóa tiếng Việt
  const ruleBased = normalizeFashionQuery(userMessage);

  // Thu thập các sản phẩm và outfit đã được gợi ý trong lịch sử
  const previousProducts = [];
  const previousOutfitIds = [];
  history.forEach((h) => {
    if (Array.isArray(h.products)) {
      previousProducts.push(...h.products);
    }
    if (h.outfitId) {
      previousOutfitIds.push(h.outfitId);
    }
  });

  const lower = userMessage.toLowerCase();
  let ruleRequestType = 'new_outfit';
  const ruleExcludeProducts = [];
  const ruleKeepProducts = [];

  if (isGreeting) {
    return {
      ...ruleBased,
      isAskingForOutfit: false,
      requestType: 'greeting',
      userIntentSummary: userMessage,
      gender: ruleBased.gender || null,
      excludeProductNames: [],
      keepProductNames: [],
      previousOutfitIds,
    };
  }

  if (lower.includes('đổi sang quần') || lower.includes('đổi quần') || lower.includes('thay quần')) {
    ruleRequestType = 'change_bottom';
    previousProducts.forEach((p) => {
      const pLower = p.toLowerCase();
      if (pLower.includes('jean') || pLower.includes('trouser') || pLower.includes('pant') || pLower.includes('skirt') || pLower.includes('quần')) {
        ruleExcludeProducts.push(p);
      } else {
        ruleKeepProducts.push(p);
      }
    });
  } else if (lower.includes('đổi sang áo') || lower.includes('đổi áo') || lower.includes('thay áo')) {
    ruleRequestType = 'change_top';
    previousProducts.forEach((p) => {
      const pLower = p.toLowerCase();
      if (pLower.includes('shirt') || pLower.includes('tee') || pLower.includes('polo') || pLower.includes('hoodie') || pLower.includes('áo')) {
        ruleExcludeProducts.push(p);
      } else {
        ruleKeepProducts.push(p);
      }
    });
  } else if (lower.includes('set khác') || lower.includes('mẫu khác') || lower.includes('bộ khác')) {
    ruleRequestType = 'new_outfit';
    ruleExcludeProducts.push(...previousProducts);
  }

  // 2. Nếu có GEMINI_API_KEY, gọi Gemini 3.6 Flash để trích xuất ngữ cảnh sâu hơn
  if (process.env.GEMINI_API_KEY) {
    const prompt = `Bạn là bộ phân tích ngữ nghĩa thời trang cho thương hiệu Routine.
Khách hàng vừa nhắn: "${userMessage}"
Lịch sử chat gần nhất:
${JSON.stringify(history.slice(-4))}

Các sản phẩm đã đề xuất trước đó: ${JSON.stringify(previousProducts)}

Nhiệm vụ: Phân tích ý định của khách thành JSON duy nhất (KHÔNG viết markdown block, CHỈ trả về chuỗi JSON):
{
  "isAskingForOutfit": boolean,
  "requestType": "greeting" | "new_outfit" | "change_bottom" | "change_top" | "refine_style",
  "category": "ao-thun" | "ao-somi" | "ao-polo" | "ao-khoac" | "quan-jeans" | "quan-tay" | "quan-short" | null,
  "fit": "oversize" | "slim-fit" | "regular" | null,
  "color": "đen" | "trắng" | "xám" | "be" | "xanh navy" | "xanh dương" | "rêu" | "nâu" | null,
  "occasion": "office" | "weekend" | "date" | "party" | "travel" | "everyday" | null,
  "gender": "men" | "women" | "unisex" | null,
  "style": "minimal" | "smart-casual" | "streetstyle" | "vintage" | "basic" | null,
  "budget": number | null,
  "excludeProductNames": string[],
  "keepProductNames": string[],
  "userIntentSummary": string
}

Lưu ý:
- "isAskingForOutfit": false nếu khách CHỈ chào hỏi ("xin chào", "hello"), hỏi vu vơ ("bạn là ai"), không yêu cầu tìm đồ cụ thể.
- Nếu khách yêu cầu đổi quần (ví dụ "đổi sang quần khác", "quần sáng màu hơn"): requestType là "change_bottom", đưa tên quần cũ vào excludeProductNames, và tên áo cũ vào keepProductNames.
- Nếu khách yêu cầu đổi áo (ví dụ "đổi sang áo polo", "tìm áo phông"): requestType là "change_top", đưa tên áo cũ vào excludeProductNames, và tên quần cũ vào keepProductNames.
- "lớn", "to", "bự", "rộng", "thùng thình" -> fit: "oversize"
- "ôm", "bó", "gọn" -> fit: "slim-fit"
- "áo phông", "tee" -> category: "ao-thun"
- "quần bò" -> category: "quan-jeans"
- "quần âu", "quần tây" -> category: "quan-tay"`;

    const aiRes = await callGeminiApi({
      contents: [{ parts: [{ text: prompt }] }],
      temperature: 0.1,
      responseMimeType: 'application/json',
    });

    if (aiRes) {
      const parsed = safeJsonParse(aiRes);
      if (parsed) {
        return {
          ...ruleBased,
          ...parsed,
          isAskingForOutfit: parsed.isAskingForOutfit !== undefined ? parsed.isAskingForOutfit : !isGreeting,
          requestType: parsed.requestType || ruleRequestType,
          fit: parsed.fit || ruleBased.fit || null,
          category: parsed.category || ruleBased.category || null,
          color: parsed.color || ruleBased.color || null,
          occasion: parsed.occasion || ruleBased.occasion || null,
          budget: parsed.budget || ruleBased.budget || null,
          gender: parsed.gender || ruleBased.gender || null,
          excludeProductNames: Array.isArray(parsed.excludeProductNames) ? parsed.excludeProductNames : ruleExcludeProducts,
          keepProductNames: Array.isArray(parsed.keepProductNames) ? parsed.keepProductNames : ruleKeepProducts,
          previousOutfitIds,
        };
      }
    }
  }

  return {
    ...ruleBased,
    isAskingForOutfit: !isGreeting,
    requestType: ruleRequestType,
    userIntentSummary: userMessage,
    gender: ruleBased.gender || null,
    excludeProductNames: ruleExcludeProducts,
    keepProductNames: ruleKeepProducts,
    previousOutfitIds,
  };
}

// Helper phân loại sản phẩm Routine chính xác theo DB
function isTop(p) {
  if (!p) return false;
  const slug = (p.categorySlug || p.categoryId || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  return slug === 'tops' || slug === 'ao' || slug === 'ao-len' || slug === 'ao-ni' || slug === 'ao-sweater' ||
    slug.includes('top') || slug.includes('shirt') ||
    name.includes('shirt') || name.includes('tee') || name.includes('polo') || name.includes('hoodie') ||
    name.includes('blouse') || name.includes('tank') || name.includes('áo') || name.includes('len') ||
    name.includes('sweater') || name.includes('dệt kim') || name.includes('nỉ');
}

function isBottom(p) {
  if (!p) return false;
  const slug = (p.categorySlug || p.categoryId || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  return slug === 'bottoms' || slug === 'quan' || slug === 'quan-kaki' || slug === 'quan-tay' ||
    slug === 'quan-vai' || slug === 'quan-jean' || slug === 'cat-jeans' || slug === 'cat-trousers' ||
    slug === 'cat-shorts' || slug === 'vay' || slug.includes('bottom') || slug.includes('quan') ||
    name.includes('pant') || name.includes('jean') || name.includes('trouser') || name.includes('skirt') ||
    name.includes('quần') || name.includes('short') || name.includes('kaki') || name.includes('váy') ||
    name.includes('đầm');
}

function isOuterwear(p) {
  if (!p) return false;
  const slug = (p.categorySlug || p.categoryId || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  return slug === 'outerwear' || slug === 'ao-khoac' || slug === 'cat-blazer' || slug === 'cat-jacket' ||
    slug === 'ao-vest' || slug.includes('khoac') || slug.includes('blazer') ||
    name.includes('jacket') || name.includes('blazer') || name.includes('cardigan') || name.includes('coat') ||
    name.includes('windbreaker') || name.includes('khoác') || name.includes('măng tô') || name.includes('vest') ||
    name.includes('bomber') || name.includes('dạ') || name.includes('phao');
}

function isAccessory(p) {
  if (!p) return false;
  const slug = (p.categorySlug || p.categoryId || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  return slug === 'phu-kien' || slug === 'non-bang-do' || slug.includes('phu-kien') ||
    name.includes('sneakers') || name.includes('belt') || name.includes('bag') || name.includes('hat') ||
    name.includes('nón') || name.includes('mũ') || name.includes('giày');
}

/**
 * Định dạng sản phẩm chuẩn hóa cho AI Stylist & InteractiveOutfitCard
 */
function formatProductForStylist(p, intent = {}) {
  if (!p) return null;
  // Kiểm tra tồn kho nghiêm ngặt: Tuyệt đối không giới thiệu sản phẩm đã hết hàng
  if (p.stockQuantity !== undefined && Number(p.stockQuantity) <= 0) {
    return null;
  }

  let mainImg = '';
  if (Array.isArray(p.images) && p.images.length > 0) mainImg = p.images[0];
  else if (typeof p.images === 'string') {
    try {
      const parsed = JSON.parse(p.images);
      mainImg = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      mainImg = p.images;
    }
  } else if (p.image) {
    mainImg = p.image;
  }

  const pSizes = Array.isArray(p.sizes)
    ? p.sizes
    : (typeof p.sizes === 'string' ? JSON.parse(p.sizes || '[]') : ['M', 'L', 'XL']);
  const pColors = Array.isArray(p.colors)
    ? p.colors
    : (typeof p.colors === 'string' ? JSON.parse(p.colors || '[]') : ['Đen', 'Trắng']);

  const finalSizes = pSizes.length > 0 ? pSizes : ['S', 'M', 'L', 'XL'];
  const finalColors = pColors.length > 0 ? pColors : ['Đen', 'Trắng', 'Xám'];

  const selectedSize = (intent.recommendedSize && finalSizes.includes(intent.recommendedSize))
    ? intent.recommendedSize
    : (intent.fit === 'oversize'
      ? (finalSizes.includes('L') ? 'L' : (finalSizes.includes('XL') ? 'XL' : finalSizes[0]))
      : (finalSizes.includes('M') ? 'M' : finalSizes[0]));

  const selectedColor = (intent.color && finalColors.find((c) => c.toLowerCase().includes(intent.color)))
    || finalColors[0]
    || 'Đen';

  return {
    id: p.id,
    productId: p.id,
    name: p.name,
    price: Number(p.price) || 0,
    originalPrice: Number(p.originalPrice || p.price) || 0,
    stockQuantity: Number(p.stockQuantity !== undefined ? p.stockQuantity : 100),
    image: mainImg || '/images/placeholder.jpg',
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [mainImg || '/images/placeholder.jpg'],
    sizes: finalSizes,
    colors: finalColors,
    selectedSize,
    selectedColor,
  };
}

/**
 * Định dạng outfit bản ghi từ DB cho AI Stylist & InteractiveOutfitCard
 */
function formatOutfitForStylist(outfitRecord, intent = {}) {
  if (!outfitRecord) return null;
  const products = (outfitRecord.products || [])
    .map((op) => op.product || op)
    .filter((p) => p && (Number(p.stockQuantity) > 0 || (p.stockQuantity === undefined && p.stock_quantity > 0)))
    .map((p) => formatProductForStylist(p, intent))
    .filter(Boolean);

  // Nếu bộ outfit mẫu bị thiếu hàng (còn ít hơn 2 sản phẩm còn hàng), hủy gợi ý outfit này
  if (products.length < 2) return null;

  const total = products.reduce((sum, item) => sum + item.price, 0);

  let coverImg = outfitRecord.image || outfitRecord.coverImage;
  if (!coverImg && Array.isArray(outfitRecord.images) && outfitRecord.images.length > 0) {
    coverImg = outfitRecord.images[0];
  }
  if (!coverImg && products.length > 0) {
    coverImg = products[0].image;
  }

  return {
    id: outfitRecord.id || `outfit-${Date.now()}`,
    title: outfitRecord.title || outfitRecord.name || 'Bộ Phối Thời Trang Routine',
    name: outfitRecord.title || outfitRecord.name || 'Bộ Phối Thời Trang Routine',
    style: outfitRecord.style || intent.style || 'minimal',
    occasion: outfitRecord.occasion || intent.occasion || 'weekend',
    fit: intent.fit || 'regular',
    image: coverImg || '/images/placeholder.jpg',
    total,
    products,
  };
}

/**
 * Tìm Curated Outfit (bộ phối chuyên gia đã định nghĩa trong bảng outfits) có độ tương thích cao nhất
 */
async function findBestCuratedOutfit(intent, userMessage = '') {
  // Nếu khách đang yêu cầu đổi riêng áo hoặc đổi riêng quần -> Để Dynamic Assembly phối hợp chính xác
  if (intent.requestType === 'change_bottom' || intent.requestType === 'change_top') {
    return null;
  }

  try {
    const outfits = await prisma.outfit.findMany({
      include: {
        products: {
          include: { product: true },
        },
      },
    });

    if (!outfits || outfits.length === 0) return null;

    const qLower = (userMessage || '').toLowerCase();
    const isExplicitPolo = qLower.includes('polo');

    let bestOutfit = null;
    let maxScore = -99;

    for (const o of outfits) {
      let sc = 0;
      const prods = (o.products || [])
        .map((op) => op.product)
        .filter((p) => p && Number(p.stockQuantity) > 0);
      const total = prods.reduce((s, p) => s + (Number(p.price) || 0), 0);

      // Nếu bộ outfit có bất kỳ món nào hết hàng hoặc không đủ 2 món còn hàng thì bỏ qua
      if (prods.length < 2 || prods.length < (o.products || []).length) continue;

      // Tránh lặp lại outfit đã gợi ý trước đó trong cuộc trò chuyện
      if (intent.previousOutfitIds && intent.previousOutfitIds.includes(o.id)) {
        sc -= 40;
      }

      // Tránh outfit chứa sản phẩm khách muốn đổi / không thích
      if (intent.excludeProductNames && intent.excludeProductNames.length > 0) {
        const hasExcluded = prods.some((p) =>
          intent.excludeProductNames.some((ex) => (p.name || '').toLowerCase().includes(ex.toLowerCase()))
        );
        if (hasExcluded) sc -= 50;
      }

      // Nếu khách yêu cầu áo polo rõ ràng mà outfit không có polo -> giảm điểm để dynamic assembly xử lý
      if (isExplicitPolo) {
        const hasPolo = prods.some((p) => (p.name || '').toLowerCase().includes('polo'));
        if (hasPolo) sc += 20;
        else sc -= 30;
      }

      // Giới tính
      if (intent.gender && intent.gender !== 'unisex') {
        const oGender = o.gender || 'unisex';
        if (oGender === intent.gender || oGender === 'unisex') sc += 3;
        else sc -= 25;
      }

      // Dịp sử dụng
      if (intent.occasion && o.occasion === intent.occasion) {
        sc += 6;
      }

      // Phong cách
      if (intent.style && o.style === intent.style) {
        sc += 4;
      }

      // Ngân sách
      if (intent.budget) {
        if (total <= intent.budget) sc += 4;
        else sc -= 15;
      }

      // Khớp chi tiết theo từ khóa
      if (qLower.includes('phông') || qLower.includes('tee') || qLower.includes('thun')) {
        if (prods.some((p) => p.name.toLowerCase().includes('tee') || p.name.toLowerCase().includes('t-shirt'))) sc += 8;
      }
      if (qLower.includes('lớn') || qLower.includes('rộng') || qLower.includes('oversize')) {
        if (prods.some((p) => p.name.toLowerCase().includes('oversized'))) sc += 8;
      }
      if (qLower.includes('công sở') || qLower.includes('lịch sự') || qLower.includes('văn phòng')) {
        if (o.occasion === 'office') sc += 6;
        if (prods.some((p) => p.name.toLowerCase().includes('shirt') || p.name.toLowerCase().includes('blazer'))) sc += 6;
      }
      if (qLower.includes('quần tây') || qLower.includes('quần âu')) {
        if (prods.some((p) => p.name.toLowerCase().includes('trouser'))) sc += 8;
      }
      if (qLower.includes('hẹn hò') || qLower.includes('date')) {
        if (o.occasion === 'date') sc += 8;
      }
      if (qLower.includes('dạo phố') || qLower.includes('cuối tuần')) {
        if (o.occasion === 'weekend') sc += 6;
      }

      if (sc > maxScore) {
        maxScore = sc;
        bestOutfit = o;
      }
    }

    if (maxScore >= 9 && bestOutfit) {
      return formatOutfitForStylist(bestOutfit, intent);
    }
    return null;
  } catch (err) {
    console.error('[aiService] Lỗi tìm curated outfit:', err);
    return null;
  }
}

/**
 * Tự động tìm kiếm và ghép bộ phối đồ linh hoạt (Dynamic Outfit Assembly) từ Database MySQL
 */
async function assembleDynamicOutfit(intent, currentProduct = null, userMessage = '') {
  const gender = intent.gender || 'unisex';
  const targetColor = intent.color || null;
  const targetFit = intent.fit || null;
  const budget = intent.budget || 2000000;
  const qLower = (userMessage || '').toLowerCase();
  const { qx, qy } = vectorEngine.projectQueryTo2DVector(userMessage);

  const excludes = (intent.excludeProductNames || []).map((n) => n.toLowerCase());
  const keeps = (intent.keepProductNames || []).map((n) => n.toLowerCase());

  // Lấy toàn bộ danh sách sản phẩm còn hàng thực tế từ MySQL (bỏ giới hạn take: 60 để không sót đồ len/quần)
  const allProducts = await prisma.product.findMany({
    where: {
      stockQuantity: { gt: 0 },
      ...(gender !== 'unisex' ? { gender: { in: [gender, 'unisex'] } } : {}),
    },
    take: 300,
    orderBy: { isFeatured: 'desc' },
  });

  if (allProducts.length === 0) {
    return null;
  }

  let chosenTop = null;
  let chosenBottom = null;
  let chosenOuterwear = null;
  let chosenAccessory = null;

  if (currentProduct) {
    if (isTop(currentProduct)) {
      chosenTop = currentProduct;
    } else if (isBottom(currentProduct)) {
      chosenBottom = currentProduct;
    } else if (isOuterwear(currentProduct)) {
      chosenOuterwear = currentProduct;
    }
  }

  const tops = allProducts.filter(isTop);
  const bottoms = allProducts.filter(isBottom);
  const outerwears = allProducts.filter(isOuterwear);
  const accessories = allProducts.filter(isAccessory);

  // Hàm chấm điểm sản phẩm Top
  function scoreTop(p) {
    let sc = 0;
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const pGender = p.gender || 'unisex';

    // Loại trừ sản phẩm khách không muốn lặp lại
    if (excludes.some((ex) => name.includes(ex) || ex.includes(name))) {
      return -1000;
    }

    // Ưu tiên giữ lại sản phẩm cũ nếu khách yêu cầu giữ
    if (keeps.some((k) => name.includes(k) || k.includes(name))) {
      sc += 500;
    }

    if (gender !== 'unisex') {
      if (pGender === gender) sc += 10;
      else if (pGender === 'unisex') sc += 5;
      else return -100;
    }

    if (qLower.includes('polo') && name.includes('polo')) sc += 35;
    if ((qLower.includes('phông') || qLower.includes('tee') || qLower.includes('thun') || intent.category === 'ao-thun') && (name.includes('tee') || name.includes('t-shirt'))) sc += 25;
    if ((qLower.includes('sơ mi') || qLower.includes('somi') || intent.category === 'ao-somi') && name.includes('shirt')) sc += 25;
    if ((qLower.includes('blouse') || intent.category === 'ao-blouse') && name.includes('blouse')) sc += 25;
    if (qLower.includes('hoodie') && name.includes('hoodie')) sc += 25;
    if ((qLower.includes('len') || intent.category === 'ao-len' || qLower.includes('sweater') || qLower.includes('dệt kim')) && (name.includes('len') || name.includes('sweater') || name.includes('dệt kim') || name.includes('cardigan'))) sc += 40;
    if ((qLower.includes('nỉ') || intent.category === 'ao-ni') && (name.includes('nỉ') || name.includes('hoodie') || name.includes('sweatshirt'))) sc += 40;

    if (targetFit === 'oversize' || qLower.includes('lớn') || qLower.includes('rộng') || qLower.includes('bự')) {
      if (name.includes('oversized') || name.includes('relaxed') || desc.includes('oversize') || desc.includes('rộng')) sc += 20;
    } else if (targetFit === 'slim-fit' || qLower.includes('ôm') || qLower.includes('gọn')) {
      if (name.includes('slim') || desc.includes('ôm')) sc += 20;
    }

    if (intent.occasion === 'office' && (name.includes('shirt') || name.includes('polo') || name.includes('len'))) sc += 12;
    if (intent.occasion === 'weekend' && (name.includes('tee') || name.includes('hoodie') || name.includes('polo') || name.includes('sweater'))) sc += 8;

    if (targetColor) {
      const colorsStr = JSON.stringify(p.colors || []).toLowerCase();
      if (colorsStr.includes(targetColor) || name.includes(targetColor)) sc += 15;
    }

    // Thưởng điểm định vị không gian Vector 2D (càng gần tọa độ mục tiêu thì điểm càng cao)
    const pVx = p.vector_x ?? p.vectorX;
    const pVy = p.vector_y ?? p.vectorY;
    if (pVx !== null && pVx !== undefined && pVy !== null && pVy !== undefined) {
      const dist2d = Math.hypot(Number(pVx) - qx, Number(pVy) - qy);
      sc += Math.max(0, 25 - dist2d * 2.5);
    }

    if (p.isFeatured) sc += 2;
    return sc;
  }

  // Hàm chấm điểm sản phẩm Bottom
  function scoreBottom(p) {
    let sc = 0;
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const pGender = p.gender || 'unisex';

    // Loại trừ sản phẩm khách không muốn lặp lại
    if (excludes.some((ex) => name.includes(ex) || ex.includes(name))) {
      return -1000;
    }

    // Ưu tiên giữ lại sản phẩm cũ nếu khách yêu cầu giữ
    if (keeps.some((k) => name.includes(k) || k.includes(name))) {
      sc += 500;
    }

    if (gender !== 'unisex') {
      if (pGender === gender) sc += 10;
      else if (pGender === 'unisex') sc += 5;
      else return -100;
    }

    if ((qLower.includes('quần tây') || qLower.includes('quần âu') || qLower.includes('tây') || qLower.includes('âu') || intent.category === 'quan-tay') && (name.includes('trouser') || name.includes('tây') || name.includes('âu') || name.includes('vải'))) sc += 35;
    if ((qLower.includes('jean') || qLower.includes('quần bò') || qLower.includes('bò') || intent.category === 'quan-jeans') && name.includes('jeans')) sc += 35;
    if ((qLower.includes('kaki') || intent.category === 'quan-kaki') && (name.includes('kaki') || name.includes('khaki') || name.includes('chinos'))) sc += 35;
    if (qLower.includes('cargo') && name.includes('cargo')) sc += 35;
    if ((qLower.includes('chân váy') || qLower.includes('skirt') || intent.category === 'vay') && (name.includes('skirt') || name.includes('váy') || name.includes('đầm'))) sc += 35;

    if (intent.occasion === 'office' && (name.includes('trouser') || name.includes('kaki'))) sc += 15;
    if (intent.occasion === 'weekend' && (name.includes('jeans') || name.includes('cargo') || name.includes('kaki'))) sc += 12;

    // Yêu cầu đổi màu sáng hoặc màu tối
    if (qLower.includes('sáng') || targetColor === 'trắng' || targetColor === 'be') {
      if (name.includes('white') || name.includes('trắng') || name.includes('pleated') || name.includes('beige')) sc += 35;
    }
    if (qLower.includes('tối') || targetColor === 'đen' || targetColor === 'xanh navy') {
      if (name.includes('black') || name.includes('đen') || name.includes('dark')) sc += 35;
    }

    // Phối màu tương phản / bổ trợ với chosenTop nếu có
    if (chosenTop) {
      const topName = chosenTop.name.toLowerCase();
      if ((topName.includes('trắng') || topName.includes('white') || topName.includes('sáng')) && (name.includes('đen') || name.includes('black') || name.includes('tối'))) {
        sc += 8;
      }
    }

    // Thưởng điểm định vị không gian Vector 2D (càng gần tọa độ mục tiêu thì điểm càng cao)
    const pVxBottom = p.vector_x ?? p.vectorX;
    const pVyBottom = p.vector_y ?? p.vectorY;
    if (pVxBottom !== null && pVxBottom !== undefined && pVyBottom !== null && pVyBottom !== undefined) {
      const dist2d = Math.hypot(Number(pVxBottom) - qx, Number(pVyBottom) - qy);
      sc += Math.max(0, 25 - dist2d * 2.5);
    }

    if (p.isFeatured) sc += 2;
    return sc;
  }

  // Hàm chấm điểm sản phẩm Outerwear (Áo khoác / Blazer / Cardigan)
  function scoreOuterwear(p) {
    let sc = 0;
    const name = (p.name || '').toLowerCase();
    const pGender = p.gender || 'unisex';

    if (excludes.some((ex) => name.includes(ex) || ex.includes(name))) return -1000;
    if (gender !== 'unisex') {
      if (pGender === gender) sc += 10;
      else if (pGender === 'unisex') sc += 5;
      else return -100;
    }

    if ((qLower.includes('blazer') || intent.category === 'cat-blazer') && name.includes('blazer')) sc += 40;
    if ((qLower.includes('vest') || intent.category === 'ao-vest') && (name.includes('vest') || name.includes('blazer'))) sc += 40;
    if (qLower.includes('măng tô') && (name.includes('măng tô') || name.includes('coat'))) sc += 40;
    if (qLower.includes('bomber') && name.includes('bomber')) sc += 40;
    if (qLower.includes('khoác dạ') && (name.includes('dạ') || name.includes('coat'))) sc += 40;
    if (qLower.includes('cardigan') && name.includes('cardigan')) sc += 40;

    if (targetColor) {
      const colorsStr = JSON.stringify(p.colors || []).toLowerCase();
      if (colorsStr.includes(targetColor) || name.includes(targetColor)) sc += 15;
    }

    // Thưởng điểm định vị không gian Vector 2D cho áo khoác
    const pVxOuter = p.vector_x ?? p.vectorX;
    const pVyOuter = p.vector_y ?? p.vectorY;
    if (pVxOuter !== null && pVxOuter !== undefined && pVyOuter !== null && pVyOuter !== undefined) {
      const dist2d = Math.hypot(Number(pVxOuter) - qx, Number(pVyOuter) - qy);
      sc += Math.max(0, 25 - dist2d * 2.5);
    }

    if (p.isFeatured) sc += 5;
    return sc;
  }

  if (!chosenTop && tops.length > 0) {
    const scoredTops = tops
      .map((p) => ({ product: p, score: scoreTop(p) }))
      .sort((a, b) => b.score - a.score);
    chosenTop = scoredTops[0]?.product || tops[0];
  }

  if (!chosenBottom && bottoms.length > 0) {
    const scoredBottoms = bottoms
      .map((p) => ({ product: p, score: scoreBottom(p) }))
      .sort((a, b) => b.score - a.score);
    chosenBottom = scoredBottoms[0]?.product || bottoms[0];
  }

  // Ưu tiên bổ sung Outerwear (Áo khoác / Blazer) cho mùa Thu Đông hoặc khi khách yêu cầu
  const wantsOuterwear = intent.season === 'autumn-winter' || intent.category === 'ao-khoac' || intent.category === 'cat-blazer' ||
    qLower.includes('thu đông') || qLower.includes('lạnh') || qLower.includes('khoác') || qLower.includes('blazer') || qLower.includes('vest') || qLower.includes('ấm');
  if (!chosenOuterwear && outerwears.length > 0 && wantsOuterwear) {
    const scoredOuterwears = outerwears
      .map((p) => ({ product: p, score: scoreOuterwear(p) }))
      .sort((a, b) => b.score - a.score);
    chosenOuterwear = scoredOuterwears[0]?.product || outerwears[0];
  }

  // CHỈ bổ sung phụ kiện khi khách hàng CÓ NHU CẦU CỤ THỂ hoặc hỏi về phụ kiện (mũ, thắt lưng, túi, giày...)
  // TUYỆT ĐỐI không tự động nhét Bucket Hat hay nón vào các set đồ khi khách không hỏi, đặc biệt là đồ len / dệt kim / công sở!
  const isWinterOrKnit = qLower.includes('len') || qLower.includes('dệt kim') || qLower.includes('thu đông') ||
    qLower.includes('ấm') || qLower.includes('sweater') || qLower.includes('nỉ') || intent.category === 'ao-len';

  const userExplicitlyWantsAccessory = qLower.includes('phụ kiện') || qLower.includes('mũ') || qLower.includes('nón') ||
    qLower.includes('hat') || qLower.includes('thắt lưng') || qLower.includes('belt') ||
    qLower.includes('túi') || qLower.includes('bag') || qLower.includes('giày') || qLower.includes('sneaker');

  if (userExplicitlyWantsAccessory && accessories.length > 0) {
    if (qLower.includes('thắt lưng') || qLower.includes('belt') || intent.occasion === 'office') {
      chosenAccessory = accessories.find((a) => a.name.toLowerCase().includes('belt') && Number(a.stockQuantity) > 0) || null;
    } else if (qLower.includes('túi') || qLower.includes('bag')) {
      chosenAccessory = accessories.find((a) => (a.name.toLowerCase().includes('bag') || a.name.toLowerCase().includes('tote')) && Number(a.stockQuantity) > 0) || null;
    } else if ((qLower.includes('mũ') || qLower.includes('nón') || qLower.includes('hat')) && !isWinterOrKnit) {
      chosenAccessory = accessories.find((a) => a.name.toLowerCase().includes('hat') && Number(a.stockQuantity) > 0) || null;
    } else if (qLower.includes('giày') || qLower.includes('sneaker')) {
      chosenAccessory = accessories.find((a) => a.name.toLowerCase().includes('sneaker') && Number(a.stockQuantity) > 0) || null;
    }
  }

  const rawSelectedItems = [chosenTop, chosenBottom, chosenAccessory, chosenOuterwear].filter(Boolean);
  const selectedItems = rawSelectedItems.map((p) => formatProductForStylist(p, intent));
  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const outfitTitle = chosenTop && chosenBottom
    ? `Bộ Phối ${chosenTop.name.split(' - ')[0]} & ${chosenBottom.name.split(' - ')[0]}`
    : (chosenTop ? `Set Thời Trang ${chosenTop.name}` : 'Bộ Phối Thời Trang Routine');

  const outfitStyle = intent.style || (intent.fit === 'oversize' ? 'streetstyle' : (intent.occasion === 'office' ? 'smart-casual' : 'minimal'));

  return {
    id: `dyn-outfit-${Date.now().toString(36)}`,
    title: outfitTitle,
    name: outfitTitle,
    style: outfitStyle,
    occasion: intent.occasion || 'weekend',
    fit: intent.fit || 'regular',
    image: chosenTop?.images?.[0] || (Array.isArray(chosenTop?.images) ? chosenTop.images[0] : chosenTop?.image) || '/images/placeholder.jpg',
    total,
    products: selectedItems,
  };
}

/**
 * Phân tích ảnh trang phục bằng Gemini Vision API
 */
async function analyzeImageWithGemini(imageBase64) {
  if (!imageBase64 || !process.env.GEMINI_API_KEY) return null;

  let mimeType = 'image/jpeg';
  let base64Data = imageBase64;
  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    base64Data = parts[1];
  }

  const prompt = `Bạn là Trợ lý phân tích thị giác thời trang (Visual Fashion AI Stylist) của thương hiệu Routine.
Hãy quan sát kỹ bức ảnh trang phục và trích xuất các đặc điểm thời trang sang JSON duy nhất (không viết markdown):
{
  "category": "ao-len" | "ao-khoac" | "cat-blazer" | "ao-thun" | "ao-somi" | "ao-polo" | "ao-ni" | "quan-jeans" | "quan-tay" | "quan-kaki" | "vay" | null,
  "color": "đen" | "trắng" | "xám" | "be" | "nâu" | "xanh navy" | "xanh dương" | "rêu" | null,
  "fit": "oversize" | "slim-fit" | "regular" | null,
  "season": "autumn-winter" | "spring-summer" | null,
  "occasion": "office" | "weekend" | "date" | "party" | null,
  "style": "minimal" | "smart-casual" | "streetstyle" | null,
  "gender": "men" | "women" | "unisex" | null,
  "description": "Mô tả ngắn gọn 1 câu về trang phục trong ảnh"
}`;

  const contents = [
    {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ],
    },
  ];

  try {
    const aiText = await callGeminiApi({
      contents,
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    if (aiText) {
      return safeJsonParse(aiText);
    }
  } catch (err) {
    console.warn('[aiService] Lỗi phân tích ảnh với Gemini Vision:', err.message);
  }
  return null;
}

/**
 * Trò chuyện với Trợ lý Thời trang AI Stylist (Multi-turn Chat & Visual Stylist)
 */
async function chatWithStylist({ message, history = [], currentProductId = null, userPreferences = null, image = null }) {
  // 1. Nếu có hình ảnh gửi kèm, dùng Gemini Vision để phân tích
  let imageAnalysis = null;
  if (image) {
    imageAnalysis = await analyzeImageWithGemini(image);
  }

  const effectiveMessage = (message && message.trim()) || (imageAnalysis ? `Tìm trang phục tương tự phong cách ${imageAnalysis.description || 'trong ảnh'}` : '');

  // Phân tích intent và chuẩn hóa từ vựng tiếng Việt với ngữ cảnh đa lượt
  const intent = await extractFashionIntent(effectiveMessage, history);

  if (imageAnalysis) {
    if (imageAnalysis.category) intent.category = imageAnalysis.category;
    if (imageAnalysis.color) intent.color = imageAnalysis.color;
    if (imageAnalysis.fit) intent.fit = imageAnalysis.fit;
    if (imageAnalysis.season) intent.season = imageAnalysis.season;
    if (imageAnalysis.occasion) intent.occasion = imageAnalysis.occasion;
    if (imageAnalysis.style) intent.style = imageAnalysis.style;
    if (imageAnalysis.gender && !intent.gender) intent.gender = imageAnalysis.gender;
    intent.isAskingForOutfit = true;
    intent.imageDescription = imageAnalysis.description;
  }

  const mLower = (message || '').toLowerCase();
  const hasExplicitGenderInMessage =
    mLower.includes('nam') ||
    mLower.includes('con trai') ||
    mLower.includes('đàn ông') ||
    mLower.includes('phái mạnh') ||
    mLower.includes('cho nam') ||
    mLower.includes('men') ||
    mLower.includes('nữ') ||
    mLower.includes('nu') ||
    mLower.includes('con gái') ||
    mLower.includes('phụ nữ') ||
    mLower.includes('phái đẹp') ||
    mLower.includes('cho nữ') ||
    mLower.includes('women');

  // Xác định giới tính mục tiêu (Effective Gender):
  // 1. Ưu tiên ý định cụ thể trong tin nhắn nếu khách yêu cầu rõ ràng
  // 2. Nếu khách đã đăng ký / đăng nhập:
  //    - Nam ('men'): chỉ gợi ý đồ nam và unisex
  //    - Nữ ('women'): chỉ gợi ý đồ nữ và unisex
  //    - Khác ('unisex'): không lọc giới tính, lấy TẤT CẢ sản phẩm trong kho
  // 3. Nếu khách chưa đăng nhập (Guest): giống như 'Khác', đưa ra TẤT CẢ sản phẩm trong kho
  if (hasExplicitGenderInMessage && intent.gender) {
    // Giữ nguyên intent.gender được trích xuất từ câu chat
  } else if (userPreferences && userPreferences.gender) {
    const g = String(userPreferences.gender).toLowerCase().trim();
    if (g === 'women' || g === 'nữ' || g === 'nu') {
      intent.gender = 'women';
    } else if (g === 'men' || g === 'nam') {
      intent.gender = 'men';
    } else {
      intent.gender = 'unisex';
    }
  } else {
    // Tài khoản chưa đăng nhập: mặc định là 'unisex' (tất cả sản phẩm)
    intent.gender = intent.gender || 'unisex';
  }

  if (userPreferences?.style && !intent.style) {
    intent.style = userPreferences.style;
  }

  // 2. Tra cứu và tính toán tư vấn kích cỡ (Size Consultation) từ MySQL
  let sizeRecommendation = null;
  if (intent.height || intent.weight) {
    sizeRecommendation = await sizeGuideService.recommendSize({
      height: intent.height,
      weight: intent.weight,
      fitPreference: intent.fit,
    });
    if (sizeRecommendation?.size) {
      intent.recommendedSize = sizeRecommendation.size;
    }
  }

  // 2.1. Nếu khách hỏi size nhưng chưa cung cấp số đo
  if (intent.isAskingForSize && !intent.height && !intent.weight) {
    return {
      message: 'Dạ Routine có đầy đủ 6 kích cỡ chuẩn từ **XS, S, M, L, XL đến XXL**. Bạn hãy chia sẻ chiều cao và cân nặng của mình (ví dụ: *“mình cao 1m70 nặng 65kg”*) để mình tra cứu bảng size trong cơ sở dữ liệu và tư vấn kích cỡ chuẩn nhất cho bạn nhé!',
      intent,
      outfit: null,
      products: [],
      total: 0,
      sizeRecommendation: null,
      followUps: [
        'Mình cao 1m60 nặng 50kg',
        'Mình cao 1m70 nặng 65kg',
        'Mình cao 1m78 nặng 75kg',
        'Xem bảng thông số size chi tiết',
      ],
    };
  }

  // 2.2. Nếu khách chỉ hỏi tư vấn size hoặc đưa số đo mà không yêu cầu tìm dòng sản phẩm cụ thể
  const isPureSizeConsultation =
    (intent.height || intent.weight) &&
    (!intent.category && (!intent.categories || intent.categories.length === 0) && !intent.occasion);

  if (isPureSizeConsultation && sizeRecommendation) {
    let outfit = await assembleDynamicOutfit(intent, null, message);
    if (!outfit) {
      const existing = await outfitService.getOutfits({ limit: 1 });
      if (existing.items?.[0]) {
        outfit = formatOutfitForStylist(existing.items[0], intent);
      }
    }

    const followUps = [
      `Gợi ý áo polo phối quần tây cho size ${sizeRecommendation.size}`,
      `Tìm áo phông oversize size ${sizeRecommendation.size} dạo phố`,
      intent.fit === 'oversize' ? 'Nếu mình muốn mặc vừa sát người thì sao?' : 'Mình thích mặc form rộng thoải mái thì chọn size nào?',
      'Xem thêm bảng số đo chi tiết của Routine',
    ];

    let fullMessage = `Dạ chào bạn! ${sizeRecommendation.reason}`;
    if (outfit && outfit.products?.length > 0) {
      fullMessage += `\n\nRoutine cũng đã chuẩn bị sẵn gợi ý set đồ theo đúng **Size ${sizeRecommendation.size}** để bạn tham khảo ngay bên dưới nhé:`;
    }

    return {
      message: fullMessage,
      intent,
      outfit,
      products: outfit?.products || [],
      total: outfit?.total || 0,
      sizeRecommendation,
      followUps,
    };
  }

  // 2.3. Nếu khách chỉ chào hỏi hoặc hỏi chuyện chung (không yêu cầu tìm đồ cụ thể)
  if (!intent.isAskingForOutfit && !intent.height && !intent.weight) {
    const greetingTemplates = [
      `Dạ Routine xin chào bạn! Mình là AI Stylist của Routine, rất vui được đồng hành cùng bạn trên hành trình định hình phong cách cá nhân. Hôm nay bạn đang muốn tìm kiếm trang phục cho dịp nào—đi làm công sở, dạo phố cuối tuần, hay một buổi hẹn hò đặc biệt? Hãy chia sẻ với mình nhé!`,
      `Xin chào bạn 👋! Mình là Trợ lý Thời trang Routine. Bạn đang cần tư vấn set đồ cho dịp nào, hay có món đồ nào (áo thun, sơ mi, polo, quần tây...) muốn phối cùng không? Mình sẵn sàng hỗ trợ bạn ngay!`,
      `Chào bạn! Rất vui được gặp bạn tại Routine. Hãy cho mình biết dịp bạn muốn diện đồ (công sở, dạo phố, đi tiệc) hoặc phong cách yêu thích, mình sẽ gợi ý set đồ chuẩn gu nhất cho bạn nhé!`
    ];
    const greetingAdvice = greetingTemplates[Math.floor(Math.random() * greetingTemplates.length)];

    return {
      message: greetingAdvice,
      intent,
      outfit: null,
      products: [],
      total: 0,
      sizeRecommendation: null,
      followUps: [
        'Tư vấn set đồ công sở lịch sự nam',
        'Tìm áo phông dáng lớn màu xám dạo phố',
        'Outfit hẹn hò cuối tuần dưới 1 triệu',
        'Gợi ý áo polo kết hợp quần tây thanh lịch',
      ],
    };
  }

  // 3. Tra cứu sản phẩm hiện tại nếu khách đang xem trang chi tiết
  let currentProduct = null;
  if (currentProductId) {
    try {
      currentProduct = await prisma.product.findUnique({ where: { id: currentProductId } });
    } catch (e) {}
  }

  // 4. Ưu tiên Curated Outfits chuẩn nếu câu hỏi phù hợp và khách không xem SP lẻ
  let outfit = null;
  if (!currentProduct) {
    outfit = await findBestCuratedOutfit(intent, message);
  }

  // 5. Nếu không có curated outfit phù hợp hoặc khách cần đổi món / phối linh hoạt:
  if (!outfit) {
    outfit = await assembleDynamicOutfit(intent, currentProduct, message);
  }

  // Fallback an toàn nếu vẫn chưa có
  if (!outfit || outfit.products.length === 0) {
    const existing = await outfitService.getOutfits({ limit: 1 });
    const fallbackOutfit = existing.items?.[0];
    if (fallbackOutfit) {
      outfit = formatOutfitForStylist(fallbackOutfit, intent);
    }
  }

  // 6. Sinh lời khuyên từ Gemini AI với phong cách chuyên gia thời trang Routine
  let stylistAdvice = '';
  const fitNote = intent.fit === 'oversize' ? 'dáng lớn thoải mái (form rộng/oversize)' : (intent.fit === 'slim-fit' ? 'dáng ôm gọn gàng' : 'phom dáng tiêu chuẩn');
  const itemsText = outfit?.products?.map((p) => `"${p.name}" (${Number(p.price).toLocaleString('vi-VN')}đ)`).join(' kết hợp với ');

  if (process.env.GEMINI_API_KEY) {
    const systemPrompt = `Bạn là Chuyên viên Tạo mẫu Thời trang (Fashion Stylist) cao cấp của Routine - thương hiệu thời trang tối giản, hiện đại và trẻ trung.
Quy tắc trả lời:
- Luôn giữ giọng điệu thanh lịch, tinh tế, truyền cảm hứng và ân cần.
- Nếu khách hàng đề cập từ như "lớn", "to", "bự", "rộng", hãy khéo léo khen ngợi gu thời trang phóng khoáng và giải thích cách phối form rộng (oversize) sao cho tôn dáng mà không bị nuốt người.
- Nếu khách hàng vừa yêu cầu đổi món đồ (đổi quần, đổi áo, đổi màu), hãy xác nhận sự thay đổi này một cách tự nhiên và giải thích vì sao món đồ mới lại kết hợp ăn ý.
- Trình bày 2 đoạn ngắn:
  + Đoạn 1: Lời chào/phản hồi trực tiếp yêu cầu của khách.
  + Đoạn 2: Giải thích cách phối set đồ được chọn (phối màu, chất liệu, mẹo mặc đẹp).
- Độ dài khoảng 80-120 từ, súc tích, không lặp từ.`;

    const chatContents = [
      ...history.map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text || h.message || '' }],
      })),
      {
        role: 'user',
        parts: [
          {
            text: `Khách hàng: "${message}".
Tiêu chí đã chuẩn hóa: Dáng mặc: ${fitNote}, Màu: ${intent.color || 'tự nhiên'}, Dịp: ${intent.occasion || 'tự do'}, Ngân sách: ${intent.budget ? intent.budget.toLocaleString('vi-VN') + 'đ' : 'linh hoạt'}.${sizeRecommendation ? `\nThông tin tư vấn size: Khách hàng phù hợp nhất với Size ${sizeRecommendation.size}. Chi tiết: ${sizeRecommendation.reason}. Hãy tư vấn khách chọn size này cho các món đồ trong set.` : ''}
Hệ thống đã chọn set: ${itemsText}. Tổng giá: ${outfit?.total?.toLocaleString('vi-VN')}đ.
Hãy viết lời tư vấn cho khách.`,
          },
        ],
      },
    ];

    const aiResponse = await callGeminiApi({
      contents: chatContents,
      systemInstruction: systemPrompt,
      temperature: 0.7,
    });

    if (aiResponse) {
      stylistAdvice = aiResponse.trim();
    }
  }

  // Fallback thông minh nếu Gemini API bận (429) hoặc tạm thời không khả dụng
  if (!stylistAdvice) {
    if (intent.requestType === 'change_bottom') {
      stylistAdvice = `Chào bạn! Mình đã đổi sang mẫu quần mới để kết hợp ăn ý cùng set đồ. Bộ trang phục với phom dáng ${fitNote} mang phong cách ${outfit?.style?.toUpperCase() || 'MINIMAL'} thanh lịch, rất thích hợp cho dịp ${intent.occasion || 'hàng ngày'}.`;
    } else if (intent.requestType === 'change_top') {
      stylistAdvice = `Chào bạn! Mình đã đổi sang mẫu áo mới theo mong muốn của bạn, giữ nguyên sự đồng điệu cho tổng thể set đồ. Phom dáng ${fitNote} trẻ trung, thoải mái cho dịp ${intent.occasion || 'hàng ngày'}.`;
    } else {
      stylistAdvice = `Chào bạn! Để đáp ứng mong muốn diện trang phục ${fitNote} của bạn, mình gợi ý set đồ ${itemsText}. Bộ trang phục mang phong cách ${outfit?.style?.toUpperCase() || 'MINIMAL'} thanh lịch, kết hợp màu sắc hài hòa và chất vải thoáng mát, rất thích hợp cho dịp ${intent.occasion || 'hàng ngày'}.`;
    }
  }

  // 7. Sinh 3 câu hỏi gợi ý tiếp theo thông minh dựa theo ngữ cảnh
  const followUps = [
    sizeRecommendation ? `Đổi sang các món đồ khác cho size ${sizeRecommendation.size}` : (intent.requestType === 'change_bottom' ? 'Đổi sang áo khác để phối cùng quần này' : 'Đổi sang quần khác để phối'),
    intent.fit === 'oversize' ? 'Có set nào dáng ôm gọn gàng hơn không?' : 'Gợi ý thêm áo form rộng dạo phố',
    intent.occasion === 'office' ? 'Tìm set dạo phố thoải mái cuối tuần' : 'Tư vấn set đồ công sở lịch sự',
    'Gợi ý set đồ ngân sách dưới 800k',
  ];

  // Bổ sung lời khuyên size vào stylistAdvice nếu có
  if (sizeRecommendation && !stylistAdvice.includes(sizeRecommendation.size)) {
    stylistAdvice = `Dạ chào bạn! ${sizeRecommendation.reason}\n\n${stylistAdvice}`;
  }

  return {
    message: stylistAdvice,
    intent,
    outfit,
    products: outfit?.products || [],
    total: outfit?.total || 0,
    sizeRecommendation: sizeRecommendation || null,
    followUps,
  };
}

/**
 * Alias tương thích ngược cho endpoint cũ
 */
async function generateOutfitRecommendation({ occasion, style, budget, gender, userMessage } = {}) {
  const result = await chatWithStylist({
    message: userMessage || `${occasion || 'hàng ngày'} ${style || 'tối giản'} ${budget || ''}`,
    userPreferences: gender ? { gender } : null,
  });
  return result;
}

async function suggestRoutines(goal) {
  return generateOutfitRecommendation({ userMessage: goal });
}

module.exports = {
  callGeminiApi,
  extractFashionIntent,
  assembleDynamicOutfit,
  chatWithStylist,
  generateOutfitRecommendation,
  suggestRoutines,
};
