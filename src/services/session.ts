import * as authApi from '../api/auth.js';
import { ApiError, isUnavailable } from '../api/http.js';
import { HttpStatus } from '../api/errors.js';
import { type Account, offlineAccount, saveOfflineAccount } from './offline-storage.js';
import { loadLibrary } from './library.js';
import { loadPreferences } from './storage.js';
import { store } from '../core/store.js';

const RETURN_CHECK_AGE = 60_000;

let lastCheck = 0;
let pending: Promise<void> | null = null;
let revision = 0;

const sameUser = (a: Account | null, b: Account | null) =>
  (a?.id ?? null) === (b?.id ?? null) && a?.username === b?.username && a?.email === b?.email;

async function setUser(user: Account | null) {
  saveOfflineAccount(user);
  if (sameUser(store.get('user'), user)) return;
  store.set({ user, myReview: null });
  await Promise.allSettled([loadLibrary(), loadPreferences()]);
}

export async function restoreSession() {
  const current = revision;
  try {
    const user = await authApi.fetchCurrentUser();
    if (current === revision) await setUser(user);
  } catch (error) {
    if (current === revision && isUnavailable(error)) await setUser(offlineAccount());
  }
  if (current === revision) lastCheck = Date.now();
}

/** Checks the cookie session without applying responses from before login or logout. */
export function refreshSession({ maxAge = 0 } = {}) {
  if (pending) return pending;
  if (Date.now() - lastCheck < maxAge) return Promise.resolve();
  const current = revision;
  const operation = authApi
    .fetchCurrentUser()
    .then((user) => {
      if (current !== revision) return;
      lastCheck = Date.now();
      return setUser(user);
    })
    .catch(() => {})
    .finally(() => {
      if (pending === operation) pending = null;
    });
  pending = operation;
  return pending;
}

export function watchSessionOnReturn(onChange: () => void) {
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) return;
    const before = store.get('user');
    await refreshSession({ maxAge: RETURN_CHECK_AGE });
    if (store.get('user') !== before) onChange();
  });
}

export async function login(credentials: Parameters<typeof authApi.login>[0]) {
  await authenticate(() => authApi.login(credentials));
}

export async function register(data: Parameters<typeof authApi.register>[0]) {
  await authenticate(() => authApi.register(data));
}

export async function logout() {
  await authenticate(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === HttpStatus.UNAUTHORIZED)) throw error;
    }
    return null;
  });
}

async function authenticate(action: () => Promise<Account | null>) {
  const current = ++revision;
  pending = null;
  lastCheck = 0;
  const user = await action();
  if (current !== revision) return;
  await setUser(user);
  if (current === revision) lastCheck = Date.now();
}

export const displayName = (user: Account | null) =>
  user?.username || user?.email || 'Пользователь';
