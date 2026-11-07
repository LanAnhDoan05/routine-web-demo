/**
 * Quản lý Attribution & Tracking nguồn mạng xã hội (TikTok, Facebook, Instagram...)
 */
import { fetchApi } from './api';

const ATTRIBUTION_STORAGE_KEY = 'routine_attribution';

/**
 * Lấy guestSessionId hiện tại
 */
function getGuestSessionId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('routine_guest_session_id') || null;
}

/**
 * Phân tích URL và ghi nhận nguồn tiếp thị vào LocalStorage/SessionStorage
 */
export function recordAttributionFromUrl(pathname = '', searchParams = null) {
  if (typeof window === 'undefined') return null;

  try {
    const params = searchParams ? searchParams : new URLSearchParams(window.location.search);
    const sourceParam = params.get('source') || params.get('utm_source') || params.get('ref');
    const campaignParam = params.get('campaign') || params.get('utm_campaign') || null;

    if (sourceParam) {
      const cleanSource = sourceParam.toUpperCase().trim();
      const attributionData = {
        platform: cleanSource,
        campaign: campaignParam,
        landingPath: pathname || window.location.pathname,
        recordedAt: new Date().toISOString(),
      };

      // Lưu vào cả localStorage và sessionStorage để giữ chân hành trình
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attributionData));
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attributionData));

      return attributionData;
    }
  } catch (err) {
    console.warn('[attribution] parse error:', err.message);
  }

  return getStoredAttribution();
}

/**
 * Lấy nguồn tiếp thị đã lưu
 */
export function getStoredAttribution() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {}
  return null;
}

/**
 * Gửi sự kiện tracking lên Backend
 */
export async function trackEvent({
  productId = null,
  action = 'VIEW',
  overridePlatform = null,
  metadata = {},
} = {}) {
  if (typeof window === 'undefined') return;

  const stored = getStoredAttribution();
  const guestSessionId = getGuestSessionId();

  // Bắt query params nếu có trên URL hiện tại
  let currentPlatform = overridePlatform;
  let campaign = null;

  if (!currentPlatform && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    currentPlatform = params.get('source') || params.get('utm_source') || params.get('ref');
    campaign = params.get('campaign') || params.get('utm_campaign');
  }

  if (!currentPlatform && stored?.platform) {
    currentPlatform = stored.platform;
    campaign = stored.campaign;
  }

  // Nếu không có nguồn nào thì coi là DIRECT
  const platformToSend = currentPlatform ? currentPlatform.toUpperCase() : 'DIRECT';

  const payload = {
    platform: platformToSend,
    campaign,
    productId,
    guestSessionId,
    action,
    metadata: {
      url: window.location.href,
      referrer: document.referrer || '',
      ...metadata,
    },
  };

  try {
    await fetchApi('/analytics/track', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Không làm gián đoạn trải nghiệm người dùng nếu tracking lỗi
    console.warn('[attribution] trackEvent failed:', err.message);
  }
}
