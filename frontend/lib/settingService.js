import { fetchApi } from './api';

export async function getHeroBanners() {
  try {
    const data = await fetchApi('/settings/hero-banners');
    if (data) return data;
  } catch (err) {
    console.warn('[settingService] getHeroBanners error:', err.message);
  }
  return null;
}

export async function updateHeroBanners(payload) {
  return await fetchApi('/settings/hero-banners', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
