import { fetchApi } from './api';

/**
 * Lấy toàn bộ số liệu thống kê thời gian thực từ Database cho Dashboard Admin
 */
export async function fetchAdminDashboard() {
  try {
    const data = await fetchApi('/analytics/admin/dashboard');
    return data;
  } catch (err) {
    console.error('[analyticsService] fetchAdminDashboard failed:', err.message);
    return null;
  }
}

/**
 * Lấy báo cáo tổng quan hệ sinh thái đa nền tảng (Dashboard Admin)
 */
export async function fetchEcosystemOverview() {
  try {
    const data = await fetchApi('/analytics/admin/overview');
    return data;
  } catch (err) {
    console.error('[analyticsService] fetchEcosystemOverview failed:', err.message);
    return null;
  }
}

/**
 * Lấy danh sách khách vãng lai (Guest Sessions)
 */
export async function fetchGuestVisitors(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.platform && params.platform !== 'ALL') query.set('platform', params.platform);
  if (params.search) query.set('search', params.search);

  try {
    const data = await fetchApi(`/analytics/admin/guests?${query.toString()}`);
    return data;
  } catch (err) {
    console.error('[analyticsService] fetchGuestVisitors failed:', err.message);
    return { items: [], pagination: { total: 0, totalPages: 0 } };
  }
}

/**
 * Lấy danh sách khách hàng thành viên có lọc theo nguồn tiếp cận
 */
export async function fetchAdminCustomers(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.source && params.source !== 'ALL') query.set('source', params.source);
  if (params.sortBy) query.set('sortBy', params.sortBy);

  try {
    const data = await fetchApi(`/admin/customers?${query.toString()}`);
    return data;
  } catch (err) {
    console.error('[analyticsService] fetchAdminCustomers failed:', err.message);
    return { items: [], pagination: { totalItems: 0, totalPages: 0 } };
  }
}

/**
 * Khóa / Mở khóa tài khoản khách hàng
 */
export async function updateCustomerStatus(id, status) {
  return await fetchApi(`/admin/customers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Lấy URL gốc (Origin) của website một cách thông minh và linh hoạt:
 * 1. Nếu đang ở trình duyệt (Client-side):
 *    - Nếu window.location.origin là domain thật (không phải localhost, vd: https://routine-xxx.vercel.app):
 *      -> Luôn ưu tiên dùng window.location.origin (trừ khi có NEXT_PUBLIC_SITE_URL là domain thật tùy chỉnh).
 *    - Nếu NEXT_PUBLIC_SITE_URL chứa localhost nhưng website đang chạy trên domain thật,
 *      -> Tự động bỏ qua localhost và lấy domain thật hiện tại của trình duyệt.
 * 2. Nếu đang ở Server-side (SSR / Static generation):
 *    - Ưu tiên NEXT_PUBLIC_SITE_URL (nếu không phải localhost).
 *    - Tự động fallback sang biến hệ thống Vercel: VERCEL_URL / NEXT_PUBLIC_VERCEL_URL.
 *    - Fallback cuối cùng mới là http://localhost:3000.
 */
export function getSiteOrigin(customOrigin = '') {
  if (customOrigin && typeof customOrigin === 'string') {
    const trimmed = customOrigin.trim().replace(/\/+$/, '');
    if (trimmed) {
      return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }
  }

  // 1. Phía Client (Trình duyệt)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const browserOrigin = window.location.origin.replace(/\/+$/, '');
    const isBrowserLocalhost = browserOrigin.includes('localhost') || browserOrigin.includes('127.0.0.1');

    const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
    const isConfigLocalhost = configuredSiteUrl.includes('localhost') || configuredSiteUrl.includes('127.0.0.1');

    // Nếu cấu hình domain riêng thật (ví dụ https://routine.vn) thì dùng domain đó
    if (configuredSiteUrl && !isConfigLocalhost) {
      return configuredSiteUrl.startsWith('http') ? configuredSiteUrl : `https://${configuredSiteUrl}`;
    }

    // Nếu đang chạy trên production/Vercel (trình duyệt không phải localhost), luôn dùng domain hiện tại
    if (!isBrowserLocalhost) {
      return browserOrigin;
    }

    // Nếu đang phát triển ở local
    return configuredSiteUrl || browserOrigin;
  }

  // 2. Phía Server (SSR / Server Actions / Static Pre-rendering)
  const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
  }

  // Vercel tự động inject VERCEL_URL (ví dụ: your-project.vercel.app)
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercelEnv) {
    const cleanVercel = vercelEnv.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${cleanVercel}`;
  }

  return envUrl || 'http://localhost:3000';
}

/**
 * Tạo đường dẫn tiếp thị chuyên biệt cho sản phẩm trên mạng xã hội
 * Tự động nhận diện domain Vercel, production hoặc localhost.
 */
export function generateCampaignUrl({ productId, platform = 'tiktok', campaign = '', customDomain = '' }) {
  if (!productId) return '';

  const origin = getSiteOrigin(customDomain);
  const p = (platform || 'tiktok').toLowerCase();
  const c = campaign ? encodeURIComponent(campaign.trim()) : `${p}_promo`;

  return `${origin}/product/${productId}?source=${p}&utm_source=${p}&utm_medium=social&utm_campaign=${c}`;
}
