import * as authApi from '../api/auth.js';
import { store } from '../core/store.js';

const RETURN_CHECK_AGE = 60_000;

let lastCheck = 0;
let pending = null;

const sameUser = (a, b) =>
  (a?.id ?? null) === (b?.id ?? null) && a?.username === b?.username && a?.email === b?.email;

function setUser(user) {
  if (!sameUser(store.get('user'), user)) store.set({ user });
}

export async function restoreSession() {
  try {
    setUser(await authApi.fetchCurrentUser());
  } catch {
    setUser(null);
  }
  lastCheck = Date.now();
}

export function refreshSession({ maxAge = 0 } = {}) {
  if (pending) return pending;
  if (Date.now() - lastCheck < maxAge) return Promise.resolve();
  pending = authApi
    .fetchCurrentUser()
    .then((user) => {
      lastCheck = Date.now();
      setUser(user);
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
  setUser(await authApi.login(credentials));
  lastCheck = Date.now();
}

export async function register(data) {
  setUser(await authApi.register(data));
  lastCheck = Date.now();
}

export async function logout() {
  await authApi.logout();
  setUser(null);
  lastCheck = Date.now();
}

export const displayName = (user) => user?.username || user?.email || 'Пользователь';
