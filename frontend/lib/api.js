// Routine API Client
export function getApiBase() {
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const envBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    // Trên Vercel / Production: nếu chưa cấu hình hoặc trỏ nhầm localhost, dùng relative /api/v1
    if (!isLocal && (!envBase || envBase.includes('localhost') || envBase.includes('127.0.0.1'))) {
      return '/api/v1';
    }
    if (envBase) {
      return envBase.endsWith('/api/v1') ? envBase : `${envBase}/api/v1`;
    }
    return isLocal ? 'http://localhost:5001/api/v1' : '/api/v1';
  }

  const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').trim().replace(/\/+$/, '');
  return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
}

export async function fetchApi(endpoint, options = {}) {
  const apiBase = getApiBase();
  const url = `${apiBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let token = null;
  let guestSessionId = null;

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('routine_token') || localStorage.getItem('token');
    if (stored) {
      try {
        const parts = stored.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const notExpired = !payload.exp || payload.exp * 1000 > Date.now();
          if (notExpired) {
            token = stored;
          }
        }
      } catch (e) {
        // fallback
      }
    }

    // Quản lý guest session id duy nhất trong localStorage
    guestSessionId = localStorage.getItem('routine_guest_session_id');
    if (!guestSessionId) {
      guestSessionId = 'g_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('routine_guest_session_id', guestSessionId);
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (guestSessionId) {
    headers['x-session-id'] = guestSessionId;
  }

  const controller = new AbortController();
  const timeoutMs = options.timeout || 30000;
  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new Error(`Yêu cầu đến ${endpoint} quá thời gian chờ (${timeoutMs / 1000}s). Vui lòng thử lại.`));
    } catch {
      controller.abort();
    }
  }, timeoutMs);

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const returnSessionId = res.headers.get('x-session-id');
    if (returnSessionId && typeof window !== 'undefined') {
      localStorage.setItem('routine_guest_session_id', returnSessionId);
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const error = new Error(json?.message || `API error: ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      throw new Error(`Kết nối máy chủ bị quá hạn (${timeoutMs / 1000}s). Vui lòng kiểm tra lại đường truyền và thử lại.`);
    }
    throw err;
  }
}

export default fetchApi;
