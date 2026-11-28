import { ApiError, isUnavailable } from '../api/http.js';
import { fetchOnlineConf } from '../api/onlineconf.js';
import { initialOnlineConf, store } from '../core/store.js';
import { refreshSession } from './session.js';

const POLL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 3_000;
let stopPolling: (() => void) | undefined;
let refreshNow: (() => Promise<void>) | undefined;

export function refreshOnlineConf() {
  return refreshNow?.();
}

export function startOnlineConf() {
  if (stopPolling) return stopPolling;

  const currentUserId = () => store.get('user')?.id ?? null;
  let pending: AbortController | undefined;

  async function refresh(replacePending = false) {
    if (pending && !replacePending) return;
    pending?.abort();
    const userId = currentUserId();
    const controller = new AbortController();
    pending = controller;
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const isCurrent = () => pending === controller && currentUserId() === userId;
    try {
      const settings = await fetchOnlineConf(controller.signal);
      if (!isCurrent() || controller.signal.aborted) return;
      const current = store.get('onlineconf');
      if (current.revision !== null && settings.revision < current.revision) return;
      store.set({ onlineconf: {
        ...settings, userId, writeEnabled: userId !== null && settings.writeEnabled,
        status: 'ready', lastSuccessAt: Date.now(),
      } });
    } catch (error) {
      if (!isCurrent()) return;
      const current = store.get('onlineconf');
      if (current.revision !== null && current.status !== 'fallback' && (controller.signal.aborted || isUnavailable(error))) {
        store.set({ onlineconf: { ...current, status: 'stale' } });
      } else {
        store.set({ onlineconf: { ...current, writeEnabled: false, status: 'fallback' } });
        if (error instanceof ApiError && error.status === 401 && userId !== null) void refreshSession();
      }
    } finally {
      window.clearTimeout(timeout);
      if (pending === controller) pending = undefined;
    }
  }

  function reset() {
    store.set({ onlineconf: initialOnlineConf(currentUserId()) });
    void refresh(true);
  }

  function refreshIfVisible() {
    if (!document.hidden) void refresh();
  }

  const unsubscribe = store.watch('user', () => {
    if (store.get('onlineconf').userId !== currentUserId()) reset();
  });
  const interval = window.setInterval(refreshIfVisible, POLL_MS);
  document.addEventListener('visibilitychange', refreshIfVisible);
  window.addEventListener('online', refreshIfVisible);
  function stop() {
    if (stopPolling !== stop) return;
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', refreshIfVisible);
    window.removeEventListener('online', refreshIfVisible);
    unsubscribe();
    pending?.abort();
    pending = undefined;
    refreshNow = undefined;
    stopPolling = undefined;
  }
  refreshNow = () => refresh(true);
  stopPolling = stop;
  reset();
  return stop;
}
