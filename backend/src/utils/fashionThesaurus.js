/**
 * fashionThesaurus.js
 * Từ điển đồng nghĩa & Bộ chuẩn hóa ngôn ngữ tự nhiên cho thời trang Routine
 * Giải quyết bài toán "Bất đồng bộ từ vựng" (khách gõ: lớn, bự, áo phông, quần bò, màu ghi...)
 */

const FIT_SYNONYMS = {
  oversize: [
    'lớn', 'lon', 'bự', 'bu', 'to', 'rộng', 'rong', 'thùng thình', 'thung thinh',
    'rộng rãi', 'rong rai', 'ngoại cỡ', 'ngoai co', 'dáng rộng', 'dang rong',
    'form rộng', 'form rong', 'form to', 'dáng to', 'oversize', 'oversized',
    'loose', 'baggy', 'dáng lớn', 'dang lon'
  ],
  'slim-fit': [
    'ôm', 'om', 'bó', 'bo', 'vừa sát', 'vua sat', 'ôm body', 'om body',
    'gọn', 'gon', 'bó sát', 'bo sat', 'ôm sát', 'om sat', 'slim', 'slimfit',
    'slim-fit', 'dáng ôm', 'dang om'
  ],
  regular: [
    'vừa', 'vua', 'vừa vặn', 'vua van', 'bình thường', 'binh thuong',
    'vừa người', 'vua nguoi', 'tiêu chuẩn', 'tieu chuan', 'regular', 'classic'
  ],
};

const CATEGORY_SYNONYMS = {
  'ao-thun': [
    'áo phông', 'ao phong', 'áo thun', 'ao thun', 't-shirt', 'tshirt', 'tee',
    'áo cộc tay', 'ao coc tay', 'cộc tay', 'phông'
  ],
  'ao-somi': [
    'áo sơ mi', 'ao so mi', 'sơ mi', 'so mi', 'sơ-mi', 'shirt', 'áo tay dài', 'áo công sở'
  ],
  'ao-polo': [
    'áo polo', 'ao polo', 'polo', 'áo có cổ', 'ao co co', 'cổ bẻ'
  ],
  'ao-len': [
    'áo len', 'ao len', 'len', 'cardigan', 'dệt kim', 'det kim', 'sweater', 'áo sweater',
    'cổ lọ', 'co lo', 'vặn thừng', 'gile len', 'áo gile'
  ],
  'ao-ni': [
    'áo nỉ', 'ao ni', 'nỉ', 'hoodie', 'áo hoodie', 'sweatshirt', 'áo nỉ chui đầu', 'nỉ bông'
  ],
  'cat-blazer': [
    'blazer', 'áo blazer', 'ao blazer', 'áo vest', 'ao vest', 'vest', 'suit',
    'blazer nam', 'blazer nữ'
  ],
  'ao-khoac': [
    'áo khoác', 'ao khoac', 'jacket', 'bomber', 'áo gió', 'ao gio', 'khoác nhẹ',
    'áo khoác dạ', 'măng tô', 'mang to', 'trench coat', 'áo phao', 'ao phao',
    'outerwear', 'áo khoác ấm', 'áo dạ'
  ],
  'quan-jeans': [
    'quần bò', 'quan bo', 'quần jean', 'quan jean', 'quần jeans', 'quan jeans',
    'bò giấy', 'denim', 'bò'
  ],
  'quan-tay': [
    'quần tây', 'quan tay', 'quần âu', 'quan au', 'trousers', 'quần vải', 'quan vai'
  ],
  'quan-short': [
    'quần đùi', 'quan dui', 'quần sooc', 'quan sooc', 'quần short', 'quan short',
    'shorts', 'short', 'bermuda'
  ],
  'quan-kaki': [
    'quần kaki', 'quan kaki', 'kaki', 'khaki', 'chinos', 'quần chinos'
  ],
  'vay': [
    'chân váy', 'chan vay', 'váy', 'vay', 'đầm', 'dam', 'midi', 'skirt',
    'chân váy xòe', 'chân váy xếp ly'
  ],
};

const SEASON_SYNONYMS = {
  'autumn-winter': [
    'thu đông', 'thu dong', 'mùa đông', 'mua dong', 'mùa thu', 'mua thu',
    'trời lạnh', 'troi lanh', 'se lạnh', 'se lanh', 'gió mùa', 'gio mua',
    'giữ ấm', 'giu am', 'ấm áp', 'am ap', 'lạnh', 'lanh', 'mùa rét', 'ret',
    'layer', 'phối layer', 'mặc ấm'
  ],
  'spring-summer': [
    'xuân hè', 'xuan he', 'mùa hè', 'mua he', 'nắng nóng', 'nang nong',
    'mát mẻ', 'mat me', 'thoáng mát', 'thoang mat', 'mùa nóng'
  ],
};

const COLOR_SYNONYMS = {
  'xám': ['ghi', 'màu tro', 'mau tro', 'xám', 'xam', 'grey', 'gray', 'xám tiêu'],
  'be': ['màu kem', 'mau kem', 'màu da', 'mau da', 'cát', 'beige', 'nâu nhạt', 'màu be'],
  'đen': ['đen', 'den', 'black', 'đen tuyền', 'den tuyen', 'tối màu', 'toi mau'],
  'trắng': ['trắng', 'trang', 'white', 'trắng sứ', 'trắng tinh', 'sáng màu', 'sang mau'],
  'xanh navy': ['navy', 'xanh đen', 'xanh den', 'xanh than', 'màu than', 'xanh đậm'],
  'xanh dương': ['xanh dương', 'xanh duong', 'xanh biển', 'xanh lam', 'blue', 'da trời'],
  'rêu': ['xanh rêu', 'xanh reu', 'rêu', 'olive', 'rêu đậm'],
  'nâu': ['nâu', 'nau', 'brown', 'nâu đất', 'nau dat', 'chocolate'],
};

const OCCASION_SYNONYMS = {
  office: [
    'đi làm', 'di lam', 'công sở', 'cong so', 'văn phòng', 'van phong',
    'hội họp', 'hoi hop', 'phỏng vấn', 'phong van', 'đi dạy', 'di day', 'thanh lịch'
  ],
  weekend: [
    'đi chơi', 'di choi', 'dạo phố', 'dao pho', 'cà phê', 'ca phe',
    'cuối tuần', 'cuoi tuan', 'gặp bạn bè', 'gap ban be', 'trà chanh'
  ],
  date: [
    'hẹn hò', 'hen ho', 'đi ăn tối', 'di an toi', 'xem phim', 'lãng mạn', 'date'
  ],
  party: [
    'tiệc tùng', 'tiec tung', 'dự tiệc', 'du tiec', 'đám cưới', 'dam cuoi',
    'sinh nhật', 'sinh nhat', 'đi quẩy', 'di quay', 'sang trọng', 'party'
  ],
  travel: [
    'du lịch', 'du lich', 'đi biển', 'di bien', 'đi phượt', 'di phuot',
    'dã ngoại', 'da ngoai', 'nghỉ dưỡng', 'nghi duong', 'picnic'
  ],
  everyday: [
    'ở nhà', 'o nha', 'mặc nhà', 'mac nha', 'thường ngày', 'thuong ngay',
    'cơ bản', 'co ban', 'dạo quanh'
  ],
};

const GENDER_SYNONYMS = {
  men: ['nam', 'con trai', 'đàn ông', 'dan ong', 'phái mạnh', 'phai manh', 'cho nam', 'chàng'],
  women: ['nữ', 'nu', 'con gái', 'con gai', 'phụ nữ', 'phu nu', 'phái đẹp', 'cho nữ', 'nàng'],
  unisex: ['cả nam nữ', 'unisex', 'đôi', 'cặp đôi', 'cho cả hai'],
};

/**
 * Trích xuất các thuộc tính chuẩn hóa từ văn bản người dùng (Rule-based Fallback)
 */
function normalizeFashionQuery(text) {
  if (!text || typeof text !== 'string') return {};
  const lower = text.toLowerCase();

  const result = {
    categories: [],
  };

  // 1. Phân tích Form dáng
  for (const [canonical, list] of Object.entries(FIT_SYNONYMS)) {
    if (list.some((kw) => lower.includes(kw))) {
      result.fit = canonical;
      break;
    }
  }

  // 2. Phân tích Danh mục (hỗ trợ trích xuất nhiều danh mục như vừa polo vừa quần tây)
  for (const [canonical, list] of Object.entries(CATEGORY_SYNONYMS)) {
    if (list.some((kw) => lower.includes(kw))) {
      result.categories.push(canonical);
      if (!result.category) {
        result.category = canonical;
      }
    }
  }

  // 3. Phân tích Màu sắc
  for (const [canonical, list] of Object.entries(COLOR_SYNONYMS)) {
    if (list.some((kw) => lower.includes(kw))) {
      result.color = canonical;
      break;
    }
  }

  // 4. Phân tích Dịp sử dụng
  for (const [canonical, list] of Object.entries(OCCASION_SYNONYMS)) {
    if (list.some((kw) => lower.includes(kw))) {
      result.occasion = canonical;
      break;
    }
  }

  // 5. Phân tích Giới tính
  for (const [canonical, list] of Object.entries(GENDER_SYNONYMS)) {
    if (list.some((kw) => lower.includes(kw))) {
      result.gender = canonical;
      break;
    }
  }

  // 6. Phân tích Mùa (Season)
  for (const [canonical, list] of Object.entries(SEASON_SYNONYMS)) {
    if (list.some((kw) => lower.includes(kw))) {
      result.season = canonical;
      break;
    }
  }

  // 7. Phân tích Ngân sách bằng Regex
  // VD: "dưới 500k", "tầm 1 triệu", "< 1tr", "tối đa 800.000"
  const budgetMatch = lower.match(/(?:dưới|tam|tầm|khoảng|khoang|dưới|tối đa|toi da|<|duoi)\s*(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|trieu|nghìn|nghin|đ|d)?/);
  if (budgetMatch) {
    const rawNum = parseFloat(budgetMatch[1].replace(',', '.'));
    const unit = budgetMatch[2];
    let budget = rawNum;
    if (unit === 'k' || unit === 'nghìn' || unit === 'nghin') {
      budget = rawNum * 1000;
    } else if (unit === 'tr' || unit === 'triệu' || unit === 'trieu') {
      budget = rawNum * 1000000;
    } else if (rawNum < 100) {
      budget = rawNum * 1000000; // VD "1.5" => 1.5 triệu
    } else if (rawNum < 10000) {
      budget = rawNum * 1000; // VD "500" => 500k
    }
    result.budget = Math.round(budget);
  }

  // 7. Phân tích Chiều cao & Cân nặng (Tư vấn kích cỡ)
  const sizeMetrics = extractHeightAndWeight(text);
  result.height = sizeMetrics.height;
  result.weight = sizeMetrics.weight;
  result.isAskingForSize = sizeMetrics.isAskingForSize;

  return result;
}

/**
 * Trích xuất Chiều cao (cm) và Cân nặng (kg) từ văn bản tiếng Việt
 */
function extractHeightAndWeight(text) {
  if (!text || typeof text !== 'string') return { height: null, weight: null, isAskingForSize: false };
  const lower = text.toLowerCase().replace(/,/g, '.');

  let height = null;
  let weight = null;

  // 1. Tìm Chiều Cao (cm)
  // Mẫu 1: "1m75", "1m7", "1 mét 75", "cao 1m70"
  const mMatch = lower.match(/(?:cao|chiều cao)?\s*([12])\s*(?:m|mét|\^)\s*(\d{1,2})(?:\s*m)?/);
  if (mMatch) {
    const meter = parseInt(mMatch[1], 10);
    let cmPart = mMatch[2];
    if (cmPart.length === 1) {
      cmPart = cmPart + '0';
    }
    height = meter * 100 + parseInt(cmPart, 10);
  }

  // Mẫu 2: "1.75m", "1.7m", "1.75 mét"
  if (!height) {
    const dotMeterMatch = lower.match(/([12]\.\d{1,2})\s*(?:m|mét)/);
    if (dotMeterMatch) {
      const val = parseFloat(dotMeterMatch[1]);
      if (val >= 1.3 && val <= 2.2) {
        height = Math.round(val * 100);
      }
    }
  }

  // Mẫu 3: "m72", "m68", "m80", "m60"
  if (!height) {
    const shortMeterMatch = lower.match(/(?:^|\s|[^\w])m([5-9]\d)(?:\s|[^\w]|$)/);
    if (shortMeterMatch) {
      height = 100 + parseInt(shortMeterMatch[1], 10);
    }
  }

  // Mẫu 4: "172cm", "172 cm", "172centimet", "cao 172"
  if (!height) {
    const cmMatch = lower.match(/(?:cao\s*)?(\d{3})\s*(?:cm|centimet)/) || lower.match(/cao\s*(\d{3})(?:\s|[^\w]|$)/);
    if (cmMatch) {
      const val = parseInt(cmMatch[1], 10);
      if (val >= 130 && val <= 220) {
        height = val;
      }
    }
  }

  // 2. Tìm Cân Nặng (kg)
  // Hỗ trợ unicode tiếng Việt (ký, kí, cân)
  const weightMatch = lower.match(/(\d{2,3}(?:\.\d+)?)\s*(?:kg|kí|ký|cân|can|kilo|kilogram)(?:[^\p{L}\p{N}]|$)/u)
    || lower.match(/(?:nặng|cân nặng)\s*(\d{2,3}(?:\.\d+)?)/);
  if (weightMatch) {
    const val = parseFloat(weightMatch[1]);
    if (val >= 35 && val <= 180) {
      weight = Math.round(val);
    }
  }

  // Trường hợp viết liền: "1m70 65" hoặc "172cm 68"
  if (height && !weight) {
    const trailingWeight = lower.match(/(?:[12]m\d{1,2}|m\d{2}|\d{3}\s*cm)\s+(?:nặng\s*)?(\d{2,3})\b/);
    if (trailingWeight) {
      const wVal = parseInt(trailingWeight[1], 10);
      if (wVal >= 35 && wVal <= 180) {
        weight = wVal;
      }
    }
  }

  // Nhận diện ý định hỏi size
  const isAskingForSize =
    lower.includes('size') ||
    lower.includes('kích cỡ') ||
    lower.includes('kich co') ||
    lower.includes('vừa không') ||
    lower.includes('vua khong') ||
    lower.includes('mặc số mấy') ||
    lower.includes('mặc số nào') ||
    lower.includes('chọn size') ||
    (height !== null && weight !== null) ||
    ((height !== null || weight !== null) && (lower.includes('tư vấn') || lower.includes('tu van') || lower.includes('mặc') || lower.includes('hợp') || lower.includes('cao') || lower.includes('nặng')));

  return { height, weight, isAskingForSize };
}

module.exports = {
  FIT_SYNONYMS,
  CATEGORY_SYNONYMS,
  SEASON_SYNONYMS,
  COLOR_SYNONYMS,
  OCCASION_SYNONYMS,
  GENDER_SYNONYMS,
  extractHeightAndWeight,
  normalizeFashionQuery,
};
