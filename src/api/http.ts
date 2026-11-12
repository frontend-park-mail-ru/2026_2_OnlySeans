import { HttpStatus } from './errors.js';
import { API_URL } from '../config.js';
import { offlineAccount, privateKey, readOffline, removeOffline, writeOffline } from '../services/offline-storage.js';

const PRIVATE_GET = /^(?:\/me\/(?:profile|library|preferences)|\/films\/\d+\/rating\/me)$/;

export function isUnavailable(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof ApiError && [502, 503, 504].includes(error.status));
}

const PAGE_LIMIT = 100;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;
export interface RequestOptions {
  method?: string;
  params?: Query;
  body?: unknown;
  signal?: AbortSignal;
  fresh?: boolean;
}

export async function request<T = unknown>(path: string, { method = 'GET', params, body, signal, fresh = false }: RequestOptions = {}): Promise<T> {
  const url = new URL(`/api${path}`, API_URL);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const accountId = offlineAccount()?.id;
  const key = !fresh && method === 'GET' && accountId !== undefined && PRIVATE_GET.test(path)
    ? privateKey(accountId, url.pathname + url.search)
    : null;

  try {
    const data = await send<T>(url, method, body, signal, fresh);
    if (key && offlineAccount()?.id === accountId) writeOffline(key, data);
    return data;
  } catch (error) {
    if (key && !signal?.aborted && offlineAccount()?.id === accountId) {
      if (isUnavailable(error)) {
        const cached = readOffline<T>(key);
        if (cached !== undefined) return cached;
      } else if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
        removeOffline(key);
      }
    }
    throw error;
  }
}

async function send<T>(url: URL, method: string, body: unknown, signal: AbortSignal | undefined, fresh: boolean): Promise<T> {
  const multipart = body instanceof FormData;
  const response = await fetch(url, {
    method,
    signal,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      ...(body === undefined || multipart ? {} : { 'Content-Type': 'application/json' }),
      ...(fresh ? { 'X-Frame-Fresh': '1' } : {}),
    },
    body: multipart ? body : JSON.stringify(body),
  });

  const text = response.status === HttpStatus.NO_CONTENT ? '' : await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!response.ok) throw new ApiError(response.status, data.error || `HTTP ${response.status}`);
  if (response.status !== HttpStatus.NO_CONTENT && !response.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError(502, 'Unexpected API response');
  }
  return data;
}

export async function requestPages<T extends { total: number }>(path: string, { params, signal, count }: RequestOptions & { count: (data: T) => number }, offset = 0): Promise<T[]> {
  const data = await request<T>(path, { params: { ...params, limit: PAGE_LIMIT, offset }, signal });
  const received = count(data);
  const next = offset + received;
  if (received === 0 || next >= data.total) return [data];
  return [data, ...(await requestPages(path, { params, signal, count }, next))];
}

export const assetUrl = (path?: string) => (path ? new URL(path, API_URL).href : '');
