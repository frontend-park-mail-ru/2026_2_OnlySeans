import { request } from '../api/http.js';
import { store } from '../core/store.js';
import { notify } from './notice.js';

export const StorageKey = Object.freeze({
  SIDEBAR_COLLAPSED: 'frame:sidebar-collapsed',
  CATALOG_VIEW: 'frame:catalog-view',
});

let preferences = {};
let owner = null;
let queue = Promise.resolve();

const currentUserId = () => store.get('user')?.id ?? null;
const hasPreferences = () => owner !== null && owner === currentUserId();

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
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
  if (!userId) return;
  await queue;
  const data = await request('/me/preferences');
  if (currentUserId() !== userId) return;
  preferences = data;
  owner = userId;
}

export function readJson(key, fallback) {
  if (hasPreferences() && Object.hasOwn(preferences, key)) return preferences[key];
  return readLocal(key, fallback);
}

export function writeJson(key, value) {
  const saved = writeLocal(key, value);
  if (!hasPreferences()) return saved;
  preferences[key] = value;
  const userId = owner;
  queue = queue
    .then(() => {
      if (currentUserId() !== userId) return null;
      return request('/me/preferences', { method: 'PUT', body: { key, value } });
    })
    .catch(() => notify('Не удалось сохранить настройки.', { type: 'error' }));
  return true;
}
