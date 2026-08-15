/** Shared HTTP helpers for the FastAPI service. */
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const apiUrl = (path: string): string =>
  `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

export const apiFetch = (path: string, options: RequestInit = {}) =>
  fetch(apiUrl(path), options);
