const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/** Error carrying the API's { code, message, details } so forms can show field errors. */
export class ApiError extends Error {
  constructor(message, details, status) { super(message); this.details = details || {}; this.status = status; }
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the API is running and try again.', {}, 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error?.message || `Request failed (${res.status}).`, body?.error?.details, res.status);
  return body;
}

export const api = {
  summary: () => request('/tickets/summary'),
  list: (params) => request(`/tickets?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))}`),
  get: (id) => request(`/tickets/${id}`),
  create: (data) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['Open', 'In Progress', 'Resolved'];
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const fmtDate = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
