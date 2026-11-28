import * as authApi from '../api/auth.js';
import { isUnavailable } from '../api/http.js';
import { ACCOUNT_KEY, type Account, offlineAccount, saveOfflineAccount } from './offline-storage.js';
import { loadLibrary } from './library.js';
import { loadPreferences } from './storage.js';
import { store } from '../core/store.js';

const RETURN_CHECK_AGE = 60_000;

let lastCheck = 0;
let pending = null;
let identityVersion = 0;

const sameUser = (a, b) =>
  (a?.id ?? null) === (b?.id ?? null) && a?.username === b?.username && a?.email === b?.email;

async function applyUser(user: Account | null) {
  if (sameUser(store.get('user'), user)) return;
  if (store.get('user')?.id !== user?.id) {
    identityVersion++;
    pending = null;
  }
  store.set({ user, myReview: null });
  await Promise.allSettled([loadLibrary(), loadPreferences()]);
}

function setUser(user: Account | null) {
  saveOfflineAccount(user);
  return applyUser(user);
}

export async function restoreSession() {
  const version = identityVersion;
  try {
    const user = await authApi.fetchCurrentUser();
    if (version === identityVersion) await setUser(user);
  } catch (error) {
    if (version === identityVersion && isUnavailable(error)) await setUser(offlineAccount());
  }
  lastCheck = Date.now();
}

export function refreshSession({ maxAge = 0 } = {}) {
  if (pending) return pending;
  if (Date.now() - lastCheck < maxAge) return Promise.resolve();
  const version = identityVersion;
  const request = authApi
    .fetchCurrentUser()
    .then((user) => {
      if (version !== identityVersion) return;
      lastCheck = Date.now();
      return setUser(user);
    })
    .catch(() => {})
    .finally(() => {
      if (pending === request) pending = null;
    });
  pending = request;
  return request;
}

export function watchSessionInOtherTabs(onChange: () => void) {
  window.addEventListener('storage', event => {
    if (event.storageArea !== localStorage || (event.key !== ACCOUNT_KEY && event.key !== null)) return;
    const user = offlineAccount();
    if (sameUser(store.get('user'), user)) return;
    lastCheck = 0;
    void applyUser(user);
    onChange();
  });
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
