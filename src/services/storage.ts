import { request } from '../api/http.js';
import { store } from '../core/store.js';
import { notify } from './notice.js';

export const StorageKey = Object.freeze({
  SIDEBAR_COLLAPSED: 'frame:sidebar-collapsed',
  CATALOG_VIEW: 'frame:catalog-view',
});

let preferences: Record<string, unknown> = {};
let owner: number | null = null;
let queue: Promise<unknown> = Promise.resolve();
const listeners = new Set<() => void>();
const remoteKeys = new Set<string>([StorageKey.SIDEBAR_COLLAPSED, StorageKey.CATALOG_VIEW]);

/** Подписывает интерфейс на загрузку и изменение сохранённых предпочтений. */
export function watchPreferences(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const publish = () => [...listeners].forEach((listener) => listener());

const currentUserId = () => store.get('user')?.id ?? null;
const hasPreferences = () => owner !== null && owner === currentUserId();

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function loadPreferences() {
  const userId = currentUserId();
  owner = null;
  preferences = {};
  if (!userId) {
    publish();
    return;
  }
  await queue;
  const data = await request<Record<string, unknown>>('/me/preferences');
  if (currentUserId() !== userId) return;
  preferences = data;
  owner = userId;
  publish();
}

export function readJson<T>(key: string, fallback: T): T {
  if (remoteKeys.has(key) && hasPreferences() && Object.hasOwn(preferences, key))
    return preferences[key] as T;
  return readLocal(key, fallback);
}

/** Сервер принимает только две настройки; остальные значения остаются локальными. */
export function writeJson(key: string, value: unknown) {
  if (key === StorageKey.CATALOG_VIEW && value !== 'grid' && value !== 'list') return false;
  if (key === StorageKey.SIDEBAR_COLLAPSED && typeof value !== 'boolean') return false;
  const saved = writeLocal(key, value);
  if (!hasPreferences() || !remoteKeys.has(key)) {
    publish();
    return saved;
  }
  preferences[key] = value;
  publish();
  const userId = owner;
  queue = queue
    .then(() => {
      if (currentUserId() !== userId) return null;
      return request<void>('/me/preferences', { method: 'PUT', body: { key, value } });
    })
    .catch(() => notify('Не удалось сохранить настройки.', { type: 'error' }));
  return true;
}
