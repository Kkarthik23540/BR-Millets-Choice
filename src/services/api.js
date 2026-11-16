let csrfToken = '';

export async function loadCsrf() {
  if (csrfToken) return csrfToken;
  const response = await fetch('/api/csrf', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Could not establish a secure session. Refresh and try again.');
  const result = await response.json();
  csrfToken = result.csrfToken;
  return csrfToken;
}

export function setCsrf(token) {
  csrfToken = token;
}

export async function api(url, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers ?? {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (!['GET', 'HEAD'].includes(options.method ?? 'GET')) {
    headers['X-CSRF-Token'] = await loadCsrf();
  }
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error ?? data.message ?? 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function money(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
}

export function formatTime12(time24) {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}
