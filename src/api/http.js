import { HttpStatus } from './errors.js';
import { API_URL } from '../config.js';

const PAGE_LIMIT = 100;

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

  const multipart = body instanceof FormData;
  const response = await fetch(url, {
    method,
    signal,
    credentials: 'include',
    headers: body === undefined || multipart ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined || multipart ? body : JSON.stringify(body),
  });

  const text = response.status === HttpStatus.NO_CONTENT ? '' : await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!response.ok) throw new ApiError(response.status, data.error || `HTTP ${response.status}`);
  return data;
}

export async function requestPages(path, { params, signal, count }, offset = 0) {
  const data = await request(path, { params: { ...params, limit: PAGE_LIMIT, offset }, signal });
  const received = count(data);
  const next = offset + received;
  if (received === 0 || next >= data.total) return [data];
  return [data, ...(await requestPages(path, { params, signal, count }, next))];
}

export const assetUrl = (path) => (path ? new URL(path, API_URL).href : '');
