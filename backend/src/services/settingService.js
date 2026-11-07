const prisma = require('../config/prisma');

const DEFAULT_HERO_CONFIG = {
  banners: [
    { id: 'hb-1', url: '/images/hero/hero-banner-1.svg', title: 'Style That Fits You - Look 1', isPrimary: true },
    { id: 'hb-2', url: '/images/hero/hero-banner-2.svg', title: 'Urban Chic - Look 2', isPrimary: false },
    { id: 'hb-3', url: '/images/hero/hero-banner-3.svg', title: 'Daily Essentials - Look 3', isPrimary: false },
  ],
  slideInterval: 2500,
  title: 'STYLE THAT FITS YOU',
  subtitle: 'Khám phá phong cách phù hợp với bạn.\nThời trang không chỉ là mặc gì. Đó là cách bạn thể hiện chính mình.',
  exploreLink: '/category/new-arrivals',
  outfitLink: '/smart-outfit',
};

const DEFAULT_PRODUCT_CARD_CONFIG = {
  cardStyle: 'standard',
  showOriginalPrice: true,
  showSalePrice: true,
  showSaleBadge: true,
  showNewBadge: true,
  showColorSwatches: true,
  showQuickAdd: true,
  showWishlist: true,
  imageAspectRatio: '3 / 4',
  columnsDesktop: 4,
  columnsTablet: 3,
  columnsMobile: 2,
  gapDesktop: 24,
  gapMobile: 16,
};

async function ensureStoreSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`store_settings\` (
      \`setting_key\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`setting_value\` LONGTEXT NOT NULL,
      \`description\` VARCHAR(255) NULL,
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
}

/**
 * Lấy cấu hình Hero Banners trang chủ (Unified full banner)
 */
async function getHeroBanners() {
  try {
    await ensureStoreSettingsTable();
    const rows = await prisma.$queryRawUnsafe(
      'SELECT `setting_value` FROM `store_settings` WHERE `setting_key` = ? LIMIT 1;',
      'home_hero_banners'
    );
    if (rows && rows.length > 0 && rows[0].setting_value) {
      const parsed = JSON.parse(rows[0].setting_value);
      const bannerList = Array.isArray(parsed.banners) && parsed.banners.length > 0
        ? parsed.banners
        : (Array.isArray(parsed.rightImages) && parsed.rightImages.length > 0
          ? parsed.rightImages
          : DEFAULT_HERO_CONFIG.banners);

      return {
        ...DEFAULT_HERO_CONFIG,
        ...parsed,
        banners: bannerList,
        slideInterval: Number(parsed.slideInterval) || 2500,
      };
    }
  } catch (err) {
    console.warn('[settingService] getHeroBanners warning:', err.message);
  }
  return DEFAULT_HERO_CONFIG;
}

/**
 * Cập nhật cấu hình Hero Banners trang chủ (Admin)
 */
async function updateHeroBanners(payload) {
  await ensureStoreSettingsTable();
  const current = await getHeroBanners();

  const nextBanners = Array.isArray(payload.banners)
    ? payload.banners
    : (Array.isArray(payload.images) ? payload.images : current.banners);

  const nextConfig = {
    ...current,
    ...payload,
    banners: nextBanners,
    slideInterval: Math.max(1000, Math.min(10000, Number(payload.slideInterval) || 2500)),
    title: payload.title !== undefined ? String(payload.title).trim() : current.title,
    subtitle: payload.subtitle !== undefined ? String(payload.subtitle).trim() : current.subtitle,
    exploreLink: payload.exploreLink !== undefined ? String(payload.exploreLink).trim() : current.exploreLink,
    outfitLink: payload.outfitLink !== undefined ? String(payload.outfitLink).trim() : current.outfitLink,
  };

  const jsonStr = JSON.stringify(nextConfig);

  await prisma.$executeRawUnsafe(
    `INSERT INTO \`store_settings\` (\`setting_key\`, \`setting_value\`, \`description\`, \`updated_at\`)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE \`setting_value\` = ?, \`updated_at\` = NOW();`,
    'home_hero_banners',
    jsonStr,
    'Cấu hình Hero Banner toàn màn hình & Slide Trang chủ',
    jsonStr
  );

  return nextConfig;
}

async function getProductCardConfig() {
  try {
    await ensureStoreSettingsTable();
    const rows = await prisma.$queryRawUnsafe(
      'SELECT `setting_value` FROM `store_settings` WHERE `setting_key` = ? LIMIT 1;',
      'product_card_config'
    );
    if (rows?.[0]?.setting_value) {
      return { ...DEFAULT_PRODUCT_CARD_CONFIG, ...JSON.parse(rows[0].setting_value) };
    }
  } catch (err) {
    console.warn('[settingService] getProductCardConfig warning:', err.message);
  }
  return DEFAULT_PRODUCT_CARD_CONFIG;
}

async function updateProductCardConfig(payload = {}) {
  await ensureStoreSettingsTable();
  const allowedStyles = new Set(['standard', 'sale', 'minimal', 'quick-buy']);
  const allowedRatios = new Set(['3 / 4', '1 / 1', '4 / 3']);
  const current = await getProductCardConfig();
  const next = {
    ...current,
    cardStyle: allowedStyles.has(payload.cardStyle) ? payload.cardStyle : current.cardStyle,
    imageAspectRatio: allowedRatios.has(payload.imageAspectRatio) ? payload.imageAspectRatio : current.imageAspectRatio,
  };

  for (const key of [
    'showOriginalPrice', 'showSalePrice', 'showSaleBadge', 'showNewBadge',
    'showColorSwatches', 'showQuickAdd', 'showWishlist',
  ]) {
    if (typeof payload[key] === 'boolean') next[key] = payload[key];
  }

  for (const [key, min, max] of [
    ['columnsDesktop', 2, 6],
    ['columnsTablet', 2, 4],
    ['columnsMobile', 1, 2],
    ['gapDesktop', 8, 48],
    ['gapMobile', 4, 32],
  ]) {
    if (Number.isFinite(Number(payload[key]))) {
      next[key] = Math.max(min, Math.min(max, Math.round(Number(payload[key]))));
    }
  }

  const json = JSON.stringify(next);
  await prisma.$executeRawUnsafe(
    `INSERT INTO \`store_settings\` (\`setting_key\`, \`setting_value\`, \`description\`, \`updated_at\`)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE \`setting_value\` = ?, \`updated_at\` = NOW();`,
    'product_card_config',
    json,
    'Cấu hình giao diện Product Card dùng chung',
    json
  );
  return next;
}

module.exports = {
  getHeroBanners,
  updateHeroBanners,
  DEFAULT_PRODUCT_CARD_CONFIG,
  getProductCardConfig,
  updateProductCardConfig,
};
