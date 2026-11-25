// Thin fetch wrapper: attaches the JWT, refreshes it once on 401, and turns error bodies into ApiError.
const KEY = 'unishare_tokens';

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const tokenStore = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  set(t) { localStorage.setItem(KEY, JSON.stringify(t)); },
  clear() { localStorage.removeItem(KEY); },
};

let refreshing = null;
async function refresh() {
  const t = tokenStore.get();
  if (!t?.refreshToken) return false;
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: t.refreshToken }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('refresh failed');
        const d = await r.json();
        tokenStore.set({ accessToken: d.accessToken, refreshToken: d.refreshToken });
        return true;
      })
      .catch(() => {
        tokenStore.clear();
        window.dispatchEvent(new Event('auth:expired'));
        return false;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

export async function api(path, { method = 'GET', body, query, retry = true } = {}) {
  let url = path;
  if (query) {
    const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    if ([...qs].length) url += '?' + qs;
  }
  const t = tokenStore.get();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (t?.accessToken) headers.Authorization = 'Bearer ' + t.accessToken;

  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }
  if (res.status === 401 && retry && t?.refreshToken && !path.startsWith('/api/auth/')) {
    if (await refresh()) return api(path, { method, body, query, retry: false });
  }
  if (res.status === 204) return null;
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new ApiError((data && data.error) || `Request failed (${res.status})`, res.status, data && data.fieldErrors);
  return data;
}
