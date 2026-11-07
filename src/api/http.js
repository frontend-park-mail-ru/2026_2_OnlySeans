import { API_URL } from '../config.js';

export { API_URL };

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function request(path, { method = 'GET', params, body, signal } = {}) {
  const url = new URL(`/api${path}`, API_URL);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method,
    signal,
    credentials: 'include',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = response.status === 204 ? '' : await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!response.ok) throw new ApiError(response.status, data.error || `HTTP ${response.status}`);
  return data;
}

export const assetUrl = (path) => (path ? new URL(path, API_URL).href : '');
