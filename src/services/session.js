import * as authApi from '../api/auth.js';
import { loadLibrary } from './library.js';
import { loadPreferences } from './storage.js';
import { store } from '../core/store.js';

const RETURN_CHECK_AGE = 60_000;

let lastCheck = 0;
let pending = null;

const sameUser = (a, b) =>
  (a?.id ?? null) === (b?.id ?? null) && a?.username === b?.username && a?.email === b?.email;

async function setUser(user) {
  if (sameUser(store.get('user'), user)) return;
  store.set({ user, myReview: null });
  await Promise.allSettled([loadLibrary(), loadPreferences()]);
}

export async function restoreSession() {
  const user = await authApi.fetchCurrentUser().catch(() => null);
  await setUser(user);
  lastCheck = Date.now();
}

export function refreshSession({ maxAge = 0 } = {}) {
  if (pending) return pending;
  if (Date.now() - lastCheck < maxAge) return Promise.resolve();
  pending = authApi
    .fetchCurrentUser()
    .then((user) => {
      lastCheck = Date.now();
      return setUser(user);
    })
    .catch(() => {})
    .finally(() => {
      pending = null;
    });
  return pending;
}

export function watchSessionOnReturn(onChange) {
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) return;
    const before = store.get('user');
    await refreshSession({ maxAge: RETURN_CHECK_AGE });
    if (store.get('user') !== before) onChange();
  });
}

export async function login(credentials) {
  await setUser(await authApi.login(credentials));
  lastCheck = Date.now();
}

export async function register(data) {
  await setUser(await authApi.register(data));
  lastCheck = Date.now();
}

export async function logout() {
  await authApi.logout();
  await setUser(null);
  lastCheck = Date.now();
}

export const displayName = (user) => user?.username || user?.email || 'Пользователь';
